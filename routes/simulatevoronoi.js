const Voronoi = require('../public/javascripts/voronoi_core');
const voronoi = new Voronoi();
const logger = require('./logger');
const e = Math.exp(1);

//TODO: check for better values
const defaultSteepness = 2,
	defaultInflexiosPont = 1,
	defaultDist = 1,
	shapeOfDif = 1 / 2;
	d = 0,
	z = 20,
	G = [];

const defaultCooperatingCost = 0.5,
	defaultDefectingCost = 0;


/**
 * SimulateVoronoi Class - allows us to simulate using voronoi diagram
 * @constructor
 */
function SimulateVoronoi() {
	this.sites = [];
	this.bbox = {};
	this.diagram = undefined;
	this.Vn = 0;
	this.V0 = this.V(0);
	this.neighborMatrix = [];

	this.inflexiosPontHelye = defaultInflexiosPont;
	this.steepness          = defaultSteepness;
	this.cooperatingCost    = defaultCooperatingCost;
	this.defectingCost      = defaultDefectingCost;
	this.dist               = defaultDist;

	this.d = this.dist * shapeOfDif;

	logger.debug("new SimulateVoronoi created");
}

/**
 * Builds up a SimulateVoronoi from client data
 *
 * @param {array} sites 		- Diagram sites coordinates(ex. [{x:5,y:5},{},...])
 * @param {object} bbox  		- Coordinates(top,bot on X and Y) of the ractangle where it was drawn
 * @param {int} gen_count 	- Generation count for the simulation
 * @param {float} coop_cost - Cost of a cooperating cell(between 0 and 1)
 * @param {int} dist 				- Distance of interaction used in the simulation
 */
SimulateVoronoi.prototype.init = function({ sites, bbox, gen_count, coop_cost, dist }) {
	logger.info('Init voronoi from the client data');
	logger.debug('Client data: ', {sites_count: sites.length, bbox, gen_count, coop_cost, dist});

	this.sites = [];
	this.bbox = bbox;
	this.generationCount = gen_count;
	this.cooperatingCost = coop_cost;
	this.dist = dist;
	this.d = this.dist * shapeOfDif;

	try {
		for (let i = 0; i < sites.length; ++i) {
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

		this.Vn = this.V(this.sites.length);
		this.diagram = voronoi.compute(this.sites, this.bbox);
		this.calculateDiffGradient();
		this.initNeighborMatrix();
		this.setPayoffs();
	} catch (error) {
		logger.error('Invalid request JSON', error);
	}
}

/**
 * Simulates using the parameters set in the init function 
 */
SimulateVoronoi.prototype.simulate = function() {
		var ret = [];
		for (let j = 0; j < this.generationCount; ++j) {
				let sitesAfterSplit = [];
				for (let i = 0; i < this.sites.length; ++i) {
						//Select a random neighbor and change payoffs if needed
						actualPoint = this.sites[i];
						let neighbors = this.getNeighbors(actualPoint);
						let rand = Math.round(Math.random() * (neighbors.length-1));
						try {
								if (neighbors[rand].payoff > actualPoint.payoff) {
										actualPoint.attrib = neighbors[rand].attrib;
										actualPoint.cost = neighbors[rand].cost;
										this.setPayoffs(actualPoint);
								}
						} catch (error) {
								logger.error('No neighbors found at: ', i);
								logger.error('X: ' + actualPoint.x + ' Y:' + actualPoint.y);
								logger.error('Rand: ' + rand + ' neighborsCount: ' + neighbors.length);
						}

						//Divide the i'th cell
						this.divideCell(actualPoint, sitesAfterSplit, neighbors);
				}
				//Create a copy of this generation and push it to results
				this.sites = sitesAfterSplit;
				this.diagram = voronoi.compute(this.sites, this.bbox);
				this.reCalculateSites();
				this.initNeighborMatrix();
				ret.push(JSON.parse(JSON.stringify(this.sites)));
		}
		logger.debug('Simulation length: ' + ret.length + ' SitesCount: ' + this.sites.length);
		return ret;
};
/**
 * Divides a cell in two smaller cells
 *
 * @param {point} actualPoint 				 - the point which has to be divided(same format as in sites)
 * @param {array} listToBeInsertedInto - the new points are inserted in this array
 * @param {array} neighbors 					 - the neighbors of the point(used for calculating the new points)
 */
SimulateVoronoi.prototype.divideCell = function(actualPoint, listToBeInsertedInto, neighbors){
	//Check if division is needed
	if (true) {
		//Find X coordinate to divide
		var min = 9999;
			shiftOnX = 0,
			shiftOnY = 0;
		for (let i in neighbors){
			if (Math.abs(neighbors[i].y - actualPoint.y) < min){
				shiftOnX = Math.abs(neighbors[i].x - actualPoint.x)/4;
				min = Math.abs(neighbors[i].y - actualPoint.y);
			}
		}
		//Check if X is valid
		if (shiftOnX + actualPoint.x > this.bbox.xr)
			shiftOnX = (this.bbox.xr - actualPoint.x)/2
		if (actualPoint.x - shiftOnX < 0){
			shiftOnX = actualPoint.x/2;
		}
		//Generate Y coordinate
		shiftOnY = Math.random() * 50;
		if (Math.random() < 0.5){
			shiftOnY = -shiftOnY;
		}
		//Check if Y is valid
		if (actualPoint.y - shiftOnY < 0 ||
				actualPoint.y + shiftOnY < 0 ||
				actualPoint.y - shiftOnY > this.bbox.yb ||
				actualPoint.y + shiftOnY > this.bbox.yb){
			shiftOnY = 0;
		}
		//Acutal dividing
		newPoint1 = {
			x: actualPoint.x - shiftOnX,
			y: actualPoint.y - shiftOnY,
			attrib: actualPoint.attrib
		}
		newPoint2 = {
			x: actualPoint.x + shiftOnX,
			y: actualPoint.y + shiftOnY,
			attrib: actualPoint.attrib
		}
		listToBeInsertedInto.push(newPoint1);
		listToBeInsertedInto.push(newPoint2);
	}
	else {
		//Insert the point as it is
		listToBeInsertedInto.push(actualPoint);
	}
}

/**
 * Takes out the duplicates from the sites variable
 * Uses the cell array that is available through the voronoi class
 */
SimulateVoronoi.prototype.reCalculateSites = function(){
	//It takes out the duplicates from this.sites
	this.sites = [];
	for (let i = 0; i < this.diagram.cells.length; ++i){
		this.sites.push(this.diagram.cells[i].site);
	}
}

/**
 * Tests if every site has a voronoiID
 */
SimulateVoronoi.prototype.checkVoronoiID = function() {
	//Error handling function, checks if each site after compute has a VoronoiID
	//If not, that s quite a big problem
	for (let i = 0; i < this.sites.length; ++i){
		if (this.sites[i].voronoiId == undefined){
			logger.error("Site with nr " + i + " has error");
			logger.error(this.sites[i]);
		}
	}
}

/**
 * Sets the payoffs of all(see optional) the cells
 *
 * @param {point} point - optional parameter, if set then only this points and its neighbors payoff will be recalculated
 */
SimulateVoronoi.prototype.setPayoffs = function(point) {
	var neighbors = this.sites;
	if (point != undefined){
		var neighbors = this.getNeighbors(point);
		neighbors.push(point);
	}
	for (var i = 0; i < neighbors.length; ++i) {
		let actualPoint = neighbors[i];
		let neighborsCount = this.getNeighborsCount(actualPoint.voronoiId);
		let cooperatingNeighbors = this.getCooperatingNeighbors(actualPoint.voronoiId);
		actualPoint.payoff = this.payoff(cooperatingNeighbors, actualPoint.cost, neighborsCount);
	}
}

/**
 * Function used for calculating the actual payoff value
 *
 * @param {int} 	cooperatingNeighborsCount
 * @param {float} cost
 * @param {int} 	neighborsCount
 */
SimulateVoronoi.prototype.payoff = function(cooperatingNeighborsCount, cost, neighborsCount) {
	return (this.V(cooperatingNeighborsCount, neighborsCount) - this.V(0, neighborsCount)) / (this.V(neighborsCount, neighborsCount) - this.V(0, neighborsCount)) - cost;
}

/**
 * Sigmoid function used here - see Cooperation among cancer cells as public goods games on Voronoi networks - Marco Archetti
 */
SimulateVoronoi.prototype.V = function(i, neighborsCount) {
	return 1 / (1 + Math.pow(e, (-this.steepness * (i - this.inflexiosPontHelye)) / neighborsCount));
}

/**
 * Finds a cell by a site coordinate
 *
 * @returns {cell} - the cell which site is equal to point
 */
SimulateVoronoi.prototype.getCellBySite = function(point, cells) {
	for (let i = 0; i < cells.length; ++i) {
		if (this.compareSites(point, cells[i].site)) 
			return cells[i];
	}
}

SimulateVoronoi.prototype.compareSites = function(site1, site2){
	if (site1.x == site2.x && site1.y == site2.y)
		return true;
	return false;
}

/**
 * Tests if every cell has at least one neighbor
 */
SimulateVoronoi.prototype.testNeighborCount = function() {
	//Error handling funciton: checks if any neighbor errors can be found
	logger.debug('Looking for neighbor errors')
		for (var i = 0; i < this.sites.length; ++i) {
				let neighbors = this.getNeighbors(this.sites[i]);
				if (neighbors.length == 0)
						logger.error('ERROR ' + i);
		}
}

/**
 * Builds up the neighbor matrix which is used to speed up finding a cells neighbors
 */
SimulateVoronoi.prototype.initNeighborMatrix = function() {
	//Initializes the neighborMatrix 
	this.neighborMatrix = Array(this.sites.length).fill().map(()=>Array(this.sites.length).fill(0));
	for (let i = 0; i < this.sites.length; ++i) {
		let cell = this.getCellBySite(this.sites[i], this.diagram.cells);
		let neighborsID = cell.getNeighborIds(cell);
		for (let j = 0; j < neighborsID.length; ++j){
			this.neighborMatrix[this.sites[i].voronoiId][neighborsID[j]] = 1;
		}
	}
}

/**
 * Finds all neighbors of a point/site/cell
 *
 * @param   {point} p - a point/site/cell
 * @returns {array}		- array of neighbors
 */
SimulateVoronoi.prototype.getNeighbors = function(p) {
	//Find neighbors of cell which has site at p point
	var neighbors = [];
	let halfedges = this.getCellBySite(p, this.diagram.cells).halfedges;
	for (let i = 0; i < halfedges.length; ++i) {
		let lsite = halfedges[i].edge.lSite
		if (lsite != null && !this.compareSites(lsite, p)) {
			neighbors.push(lsite);
		}
		let rsite = halfedges[i].edge.rSite
		if (rsite != null && !this.compareSites(rsite, p)){
		neighbors.push(rsite);
		} 
	}
	return neighbors;
}

/**
 * Counts the neighbors of a point/site/cell
 * 
 * @param 	{int} index	 - the index(voronoiID) of a point/site/cell
 * @returns {int}			 - total number of neighbors
 */
SimulateVoronoi.prototype.getNeighborsCount = function(index) {
	var count = 0;
	for (let i = 0; i < this.neighborMatrix[index].length; ++i) {
		if (this.neighborMatrix[index][i] != 0) {
			count++;
		}
	}
	return count;
}

/**
 * Counts the cooperating neighbors of a point/site/cell
 * Distance is taken in consideration
 * 
 * @param 	{int} k	- the index(voronoiID) of a point/site/cell
 * @returns {int} 	- total number of cooperating neighbors
 */
SimulateVoronoi.prototype.getCooperatingNeighbors = function(k) {
	var neighbors = [];
	neighbors.push(k);

	var newneighbors = [];
	var coops = 0;
	var newtable = [];
	var seen = new Array(this.neighborMatrix[0].length);
	seen.fill(0);
	seen[k] = 1;

	newtable = this.neighborMatrix.slice();

	for (var d = 0; d < this.dist; ++d) {
		newneighbors = [];
		var gradcoops = 0;
		for (var i = 0; i < neighbors.length; ++i) {
			for (var j = 0; j < newtable[i].length; ++j) {
				if (seen[j] == 0 && newtable[neighbors[i]][j] == 'c') {
					gradcoops++;
					newneighbors.push(j);
					seen[j] = 1;
				} else 
				if (seen[j] == 0 && this.neighborMatrix[neighbors[i]][j] == 'd') {
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

/**
 * Builds a up an array that is used at the distance calculation
 */
SimulateVoronoi.prototype.calculateDiffGradient = function() {
	G[0] = 1;
	for (var i = 1; i <= this.dist; ++i) {
		G[i] = 1 - ((this.g(i) - this.g(0) / this.g(this.dist) - this.g(0)));
	}
}

/**
 * Sigmoid function - see SimulateVoronoi.prototype.V function
 */
SimulateVoronoi.prototype.g = function(i) {
	return 1 / (1 + Math.pow(e, (-z * (i - this.d) / this.dist)));
}

/**
 * Calculates the dividing chance
 * @param 	{int} time - as time progresses ahead so does the function value change
 * @returns {float} 	 - value between [0,1]
 */
SimulateVoronoi.prototype.dividingChance = function(time) {
	//TODO: this should be a function, not random
	return Math.random();
}

/**
 * Calculates the death chance
 * @param {int} time - as time progresses ahead so does the function value change
 * @returns {float}  - value between [0,1]
 */
SimulateVoronoi.prototype.deathChance = function(time) {
	//TODO: this should be a function, not random
	return Math.random();
}

module.exports = SimulateVoronoi;
