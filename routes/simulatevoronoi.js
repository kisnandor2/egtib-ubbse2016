

const Voronoi = require('./module.voronoi');
const voronoi = new Voronoi();
const logger = require('./logger');
const e = Math.exp(1);

//TODO: check for better values
const s = 20;
const defaultInflexiosPont = 2.5;
const cooperatingCost = 0.5;
const defectingCost = 0;

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
SimulateVoronoi.prototype.init = function(sites){
	this.sites = [];
	try {
		for (let i = 0; i < sites.length; ++i){
			let site = sites[i];
			let cost = undefined;
			if (site.attrib == 'c')
				cost = cooperatingCost;
			else
				cost = defectingCost;
			this.sites.push({
				x: parseFloat(site.x),
				y: parseFloat(site.y),
				attrib: site.attrib,
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
		logger.error('Invalid request JSON', sites);
		return false;
	}

}
SimulateVoronoi.prototype.initVoronoi = function() {
	this.sites = [];
	logger.trace('Building up a voronoi on the server side!');
	//Can be used only when no information is available from the client
	for (var i = 0; i < this.initialSize.x; i += 100) {
		for (var j = 0; j < this.initialSize.y; j += 100) {
			if (Math.random() <= 0.95) {
				attrib = 'c';
				cost = cooperatingCost;
			} else {
				attrib = 'd';
				cost = defectingCost;
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

SimulateVoronoi.prototype.simulate = function() {
	var ret = [];
	for (var j = 0; j < this.sites.length; ++j) {
		var i = Math.floor(Math.random() * this.sites.length);
		//Get 'c' neighbors
		var neighbors = this.getNeighbors(this.sites[i], this.diagram);
		var cooperatingNeighbors = 0;
		for (var k = 0; k < neighbors.length; ++k) {
		  if (neighbors[k].attrib == 'c')
		    ++cooperatingNeighbors;
		}
		//Calculate the payoff if not defined yet
		neighbors = this.getNeighbors(this.sites[i],this.diagram);
		var k = Math.floor(Math.random() * neighbors.length);
		try {
			if (neighbors[k].payoff > this.sites[i].payoff) {
			  this.sites[i].attrib = neighbors[k].attrib;
			  this.sites[i].cost = neighbors[k].cost;
			  this.setPayoffs();
			}
		}
		catch (error){
			logger.error('No neighbors found!', error);
		} 

		// if (this.getNeighbors(this.sites[j], this.diagram) == 0){
		// 	// console.log(this.sites[j]);
		// }
		// if (this.sites[j].attrib == 'd')
		// 	this.sites[j].attrib = 'c';
		// else
		// 	this.sites[j].attrib = 'd'
		ret.push(JSON.parse(JSON.stringify(this.sites)));
	}
	logger.debug('Simulation length(Generations):', ret.length);
	return ret;
};

SimulateVoronoi.prototype.setPayoffs = function() {
	for (var i = 0; i < this.sites.length; ++i) {
		//Get 'c' neighbors
		var neighbors = this.getNeighbors(this.sites[i], this.diagram);
		var cooperatingNeighbors = 0;
		for (var j = 0; j < neighbors.length; ++j) {
			if (neighbors[j].attrib == 'c')
				++cooperatingNeighbors;
		}
		//Calculate the payoff
		this.sites[i].payoff = this.payoff(cooperatingNeighbors, this.sites[i].cost, neighbors.length);
	}
}

SimulateVoronoi.prototype.payoff = function(cooperatingNeighborsCount, cost, neighborsCount) {
	return (this.V(cooperatingNeighborsCount, neighborsCount) - this.V(0,neighborsCount)) / (this.V(neighborsCount,neighborsCount) - this.V(0,neighborsCount)) - cost;
}

SimulateVoronoi.prototype.V = function(i, neighborsCount) {
	return 1 / (1 + Math.pow(e, (-s * (i - this.inflexiosPontHelye)) / neighborsCount));
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

module.exports = SimulateVoronoi;