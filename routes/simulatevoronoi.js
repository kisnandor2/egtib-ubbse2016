

const Voronoi = require('./module.voronoi');
const voronoi = new Voronoi();
const logger = require('./logger');
const e = Math.exp(1);

//TODO: check for better values
const defaultSteepness = 2,
			defaultInflexiosPont = 1,
			defectingCost = 0;

const defaultCooperatingCost = 0.5,
			defaultDefectingCost = 0;

function SimulateVoronoi(id) {

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
	this.Vn = 0;
	this.V0 = 0;
	this.id = id;
	this.initVoronoi();
	this.diagram = voronoi.compute(this.sites, this.bbox);
	this.setPayoffs();
	//logger.trace("new SimulateVoronoi created");
}
SimulateVoronoi.prototype.copy = function(v){
	this.diagram =  v.diagram;
	this.bbox = v.bbox;
	this.sites = v.sites;
	this.initialSize = v.initialSize;
	this.cellakSzama = v.cellakSzama;
	this.inflexiosPontHelye = v.inflexiosPontHelye;
	this.Vn = v.Vn;
	this.V0 = v.V0;

	this.diagram = v.diagram;
}
SimulateVoronoi.prototype.write = function(){
	console.log("alive");
}
SimulateVoronoi.prototype.init = function({sites, bbox, gen_count, coop_cost}){
	logger.info('Init voronoi from the client data');
	logger.debug('Coop cost: ', coop_cost);

	this.sites = [];
	this.bbox = bbox;
	this.gen_count = gen_count;
	this.cooperatingCost = coop_cost;

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
	var ret = [JSON.parse(JSON.stringify(this.sites))];
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
		let neighbors = this.getNeighbors(this.sites[i], this.diagram);
		let cooperatingNeighbors = this.getCooperatingNeighborsCount(neighbors);
		//Calculate the payoff
		this.sites[i].payoff = this.payoff(cooperatingNeighbors, this.sites[i].cost, neighbors.length);
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
	var halfedges = this.getCellBySite(p, diagram.cells).halfedges;
	for (var i in halfedges) {
		var lsite = halfedges[i].edge.lSite
		if (lsite != null && !this.compareSites(lsite, p)) neighbors.push(lsite);
		var rsite = halfedges[i].edge.rSite
		if (rsite != null && !this.compareSites(rsite, p)) neighbors.push(rsite);
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

module.exports = SimulateVoronoi;