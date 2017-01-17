

const Voronoi = require('../public/javascripts/voronoi_core');
const voronoi = new Voronoi();
const logger = require('./logger');
const e = Math.exp(1);

//TODO: check for better values
const defaultSteepness = 2,
			defaultInflexiosPont = 1,
			defectingCost = 0;

const defaultCooperatingCost = 0.5,
			defaultDefectingCost = 0;

const defaultDist = 1, 
			shape_of_dif = 1/2;
			d = 0,
			z = 20;
const G = [];


function SimulateVoronoi() {

	//const e = Math.exp(1);
	this.diagram = null;
	this.bbox = {
			xl: 0,
			xr: 800,
			yt: 0,
			yb: 600
	};
	this.sites = [];
	this.initialSize = {
			x: 1360,
			y: 680
	};
	this.cellakSzama = 0;
	this.inflexiosPontHelye = defaultInflexiosPont;
	this.steepness = defaultSteepness;
	this.cooperatingCost = defaultCooperatingCost;
	this.defectingCost = defaultDefectingCost;
	this.dist = defaultDist;
	this.d = defaultDist * shape_of_dif;
	this.Vn = 0;
	this.V0 = 0;
	this.neighborMatrix = [];
	logger.debug("new SimulateVoronoi created");
}
SimulateVoronoi.prototype.copy = function(v){
	this.diagram =  v.diagram;
	this.bbox = v.bbox;
	this.sites = v.sites;
	this.initialSize = v.initialSize;
	this.cellakSzama = v.cellakSzama;
	this.inflexiosPontHelye = v.inflexiosPontHelye;
	this.steepness = v.steepness;
	this.cooperatingCost = v.cooperatingCost;
	this.defectingCost = v.defectingCost;
	this.dist = v.dist;
	this.d = v.d;
	this.Vn = v.Vn;
	this.V0 = v.V0;
	this.neighborMatrix = v.neighborMatrix;
	this.diagram = v.diagram;
	this.setPayoffs();
}
SimulateVoronoi.prototype.write = function(){
	console.log("alive");
}
SimulateVoronoi.prototype.init = function({sites, bbox, gen_count, coop_cost, dist}){
	logger.info('Init voronoi from the client data');
	logger.debug('Coop cost: ', coop_cost);

	this.sites = [];
	this.bbox = bbox;
	this.gen_count = gen_count;
	this.cooperatingCost = coop_cost;
	this.dist = dist;
	this.d = dist * shape_of_dif;

	try {
		for (let i = 0; i < sites.length; ++i){
			let site = sites[i];
			let cost = undefined;
			if (site[3] == 'c')
				cost = this.cooperatingCost;
			else
				cost = this.defectingCost;
			this.sites.push({
				x: site[1],
				y: site[2],
				attrib: site[3],
				cost: cost,
				payoff: undefined
			})
		}

		this.cellakSzama = this.sites.length;
		this.Vn = this.V(this.sites.length);
		this.V0 = this.V(0);
		this.diagram = voronoi.compute(this.sites, this.bbox);
		this.calculateDiffGradient();
		this.setMatrix();
		this.setPayoffs();
		return true;
	}
	catch (error){
		logger.error('Invalid request JSON', error);
		return false;
	}
}
SimulateVoronoi.prototype.initVoronoi = function() {
	this.sites = [];
	logger.info('Building up a voronoi on the server side!');
	//Can be used only when no information is available from the client
	for (var i = 0; i < this.initialSize.x; i += 100) {
		for (var j = 0; j < this.initialSize.y; j += 100) {
			if (Math.random() <= 0.95) {
				attrib = 'c';
				cost = this.cooperatingCost;
			} else {
				attrib = 'd';
				cost = this.defectingCost;
			}
			this.sites.push({
				x: i,
				y: j,
				attrib: attrib,
				cost: cost,
				payoff: undefined
			});
		}
	}
	this.cellakSzama = this.sites.length;
	this.Vn = this.V(this.sites.length);
	this.V0 = this.V(0);
};

SimulateVoronoi.prototype.getCooperatingNeighborsCount = function(neighbors) {
	let cooperatingNeighbors = 0;
	for (var k = 0; k < neighbors.length; ++k) {
		if (neighbors[k].attrib == 'c')
			++cooperatingNeighbors;
	}
	return cooperatingNeighbors;
}

SimulateVoronoi.prototype.simulate = function() {
	var ret = [];
	for (var j = 0; j < this.gen_count; ++j) {
		// var i = Math.floor(Math.random() * this.sites.length);
		for (var i = 0; i < this.sites.length; ++i) {
			//Get 'c' neighbors
			var neighbors = this.getNeighbors(this.sites[i], this.diagram);
			var cooperatingNeighbors = this.getCooperatingNeighborsCount(neighbors);

			//Select a random neighbor and change payoffs if needed
			var k = Math.floor(Math.random() * neighbors.length);
			try {
				if (neighbors[k].payoff > this.sites[i].payoff) {
					this.sites[i].attrib = neighbors[k].attrib;
					this.sites[i].cost = neighbors[k].cost;
					this.setPayoffs();
				}
			}
			catch (error){
				logger.error('No neighbors found at: ', i);
			}
		}
		//Create a copy of this generation and push it to results
		ret.push(JSON.parse(JSON.stringify(this.sites)));
	}
	logger.debug('Simulation length(Generations):', ret.length);
	return ret;
};

SimulateVoronoi.prototype.setPayoffs = function() {
	for (var i = 0; i < this.sites.length; ++i) {
		//Get 'c' neighbors
		if (this.dist == 1) {

		let neighbors = this.getNeighbors(this.sites[i], this.diagram);
			var cooperatingNeighbors = this.getCooperatingNeighborsCount(neighbors);
			var neighborsCount = neighbors.length;	
		} else {

		var neighborsCount = this.getNeighborsCount(this.sites[i].voronoiId, this.neighborMatrix);
			var cooperatingNeighbors = this.getCooperatingNeighbors(this.sites[i].voronoiId, this.dist, this.neighborMatrix );

		}	
	 	//var cooperatingNeighbors = this.getCooperatingNeighbors(this.sites[i].voronoiId, this.dist, this.neighborMatrix );

		//Calculate the payoff
		this.sites[i].payoff = this.payoff(cooperatingNeighbors, this.sites[i].cost, neighborsCount);
	}
}

SimulateVoronoi.prototype.payoff = function(cooperatingNeighborsCount, cost, neighborsCount) {
	return (this.V(cooperatingNeighborsCount, neighborsCount) - this.V(0,neighborsCount)) / (this.V(neighborsCount,neighborsCount) - this.V(0,neighborsCount)) - cost;
}

SimulateVoronoi.prototype.V = function(i, neighborsCount) {
	return 1 / (1 + Math.pow(e, (-this.steepness * (i - this.inflexiosPontHelye)) / neighborsCount));
}

SimulateVoronoi.prototype.getNeighbors = function(p, diagram) {
	//find neighbors of cell which has site at p point
	var neighbors = [];
	var neighborsid = [];
	var halfedges = this.getCellBySite(p, diagram.cells).halfedges;
	for (var i in halfedges) {
		var lsite = halfedges[i].edge.lSite
		if (lsite != null && !this.compareSites(lsite, p)) {
			neighbors.push(lsite);
			neighborsid.push(lsite.voronoiId);
		}
		var rsite = halfedges[i].edge.rSite
		if (rsite != null && !this.compareSites(rsite, p)){
		neighbors.push(rsite);
		neighborsid.push(rsite.voronoiId)	
		} 
	}
	return neighbors;
}

SimulateVoronoi.prototype.getCellBySite = function(point, cells) {
	//returns the cell which site is equal to point
	for (var i in cells) {
		if (this.compareSites(cells[i].site, point)) return cells[i];
	}
}

SimulateVoronoi.prototype.compareSites = function(s1, s2) {
	if (s1.x == s2.x && s1.y == s2.y) return true;
	return false;
}

SimulateVoronoi.prototype.testNeighborCount = function(){
	console.log('testing ' + this.sites.length);
	for (var i = 0; i < this.sites.length; ++i){
		let neighbors =  this.getNeighbors(this.sites[i], this.diagram);
		if (neighbors.length == 0)
			console.log('ERROR ' + i);
	}
}

SimulateVoronoi.prototype.setMatrix = function(){
	for (var i=0; i<this.sites.length; ++i){
		this.neighborMatrix.push([]);
		for (var j=0; j<this.sites.length; ++j){
			this.neighborMatrix[i].push(0);
		}
	}
	for (var i=0; i<this.sites.length; ++i){
		var halfedges = this.getCellBySite(this.sites[i], this.diagram.cells).halfedges;
		for (var j in halfedges) {
			var lsite = halfedges[j].edge.lSite
			if (lsite != null && !this.compareSites(lsite, this.sites[i])) {
				this.neighborMatrix[this.sites[i].voronoiId][lsite.voronoiId] = lsite.attrib;
			}
			var rsite = halfedges[j].edge.rSite
			if (rsite != null && !this.compareSites(rsite, this.sites[i])){
				this.neighborMatrix[this.sites[i].voronoiId][rsite.voronoiId] = rsite.attrib;

		} 
	}
	}
}
SimulateVoronoi.prototype.getNeighborsCount = function(k, table){
	var count = 0;
	for (var i=0; i<table[k].length; ++i){
		if (table[k][i] != 0) {
			count++;
		}
	}
	return count;
}
SimulateVoronoi.prototype.getCooperatingNeighbors = function(k, dist, table){

	var neighbors = []; neighbors.push(k);
	var newneighbors = [];
	var coops = 0;
	var newtable = [];
	var seen  = [];
	for (var i=0; i<table[0].length; i++){
		seen.push(0);
	}
	seen[k] = 1;
	newtable = table.slice();
	for (var d=1; d<=dist; ++d){
		newneighbors = [];
		var gradcoops = 0;
		for (var i=0; i<neighbors.length;  ++i){
			for (var j=0; j<newtable[i].length; ++j){
				if (seen[j]== 0 && newtable[neighbors[i]][j] == 'c') {
					gradcoops++;
					newneighbors.push(j);
					seen[j] = 1;
				} else if (seen[j] == 0 && table[neighbors[i]][j] == 'd'){
					newneighbors.push(j);
					seen[j] = 1;
				}
			}
		}
		neighbors = newneighbors.slice();
		coops = coops + G[d] * gradcoops;
	}
	return coops;
}

SimulateVoronoi.prototype.calculateDiffGradient = function(){
	G[0] = 1;
	for (var i = 1; i<=this.dist; ++i){
		G[i] = 1 - ((this.g(i)-this.g(0)/this.g(this.dist)-this.g(0)));
	}
}

SimulateVoronoi.prototype.g = function(i){
	return 1 / (1 + Math.pow(e, (-z * (i - this.d) / this.dist)));
}


module.exports = SimulateVoronoi;