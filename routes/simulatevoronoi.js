const voronoi = new (require('../public/javascripts/voronoi_core'))();
const logger = require('./logger');
const myRandomGenerator = new (require('./MyRandomGenerator'))();
const Timer = require('../public/javascripts/timer');
const fs = require('fs');
const constantFunctions = new (require('./ConstantFunctions'))();
const Cell = require('./Cell')

const alfa = 0.1; //dividing chance constant
const e = Math.exp(1);

/**
 * SimulateVoronoi Class - allows us to simulate using voronoi diagram
 * @constructor
 */
function SimulateVoronoi() {
	this.diagram 						= undefined;
	this.dist               = undefined;
	this.cooperatingCost    = undefined;
	this.defectingCost      = 0;

	constantFunctions.dist = 1;
	this.sites = [];
	this.bbox = {};
	this.neighborMatrix = [];

	logger.debug("new SimulateVoronoi created");
	// this.timer = new Timer(this);
}

/**
 * Initialize the randomGenerator based on ID
 * Used for generating the same simulation as many times as needed with different parameters
 * @param {int} randomGeneratorID
 * @returns {randomGenerator}
 */
SimulateVoronoi.prototype.swtichRandomGenerator = function(randomGeneratorID) {
	if (randomGeneratorID == 1){
		myRandomGenerator.lastIndex = 0;
		return myRandomGenerator;
	}
	return Math;
}

/**
 * Returns the dividing chance for a generation, value between [0,1]
 * @param 	{int} time
 * @returns {double}
 */
SimulateVoronoi.prototype.getDividingChance = function(time){
	let K = this.x0 * 2;
	let x0 = this.x0;
	let numberOfCellsWeWant = Math.ceil(K*(Math.pow(x0/K,Math.pow(e,-alfa*time))));
	let chance = numberOfCellsWeWant / this.sites.length - 1;
	return chance;
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
SimulateVoronoi.prototype.init = function({ sites, bbox, gen_count, coop_cost, dist, randomGeneratorID }) {
	logger.info('Init voronoi from the client data');
	logger.debug('Client data: ', {sites_count: sites.length, bbox, gen_count, coop_cost, dist});

	this.sites = [];
	this.bbox = bbox;
	this.generationCount = gen_count;
	this.cooperatingCost = coop_cost;
	this.dist = dist;
	constantFunctions.distance = dist;
	this.randomGenerator = this.swtichRandomGenerator(randomGeneratorID);

	try {
		for (let i = 0; i < sites.length; ++i) {
			let site = sites[i];
			let cost = undefined;
			if (site[3] == 'c')
				cost = this.cooperatingCost;
			else
				cost = this.defectingCost;
			this.sites.push(new Cell({
				x: site[1],
				y: site[2],
				attrib: site[3],
				cost: cost,
				bbox: this.bbox
			}))
		}

		this.x0 = this.sites.length;
		this.diagram = voronoi.compute(this.sites, this.bbox);
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
				let divChance = this.getDividingChance(j+1);
				let sitesBeforeChange = this.sites.slice(0);
				for (let i = 0; i < this.sites.length; ++i) {
						//Select a random neighbor and change payoffs if needed
						actualPoint = this.sites[i];
						let neighbors = this.getNeighbors(sitesBeforeChange[i]);
						let rand = Math.round(this.randomGenerator.random() * (neighbors.length-1));
						try {
								// console.log(neighbors[rand].payoff, actualPoint.payoff)
								if (neighbors[rand].attrib != actualPoint.attrib && neighbors[rand].payoff > actualPoint.payoff) {
										console.log(neighbors[rand].payoff, actualPoint.payoff)
										actualPoint.attrib = neighbors[rand].attrib;
										actualPoint.cost = neighbors[rand].cost;
								}
						} catch (error) {
								logger.error('No neighbors found at: ', i);
								logger.error('X: ' + actualPoint.x + ' Y:' + actualPoint.y);
								logger.error('Rand: ' + rand + ' neighborsCount: ' + neighbors.length);
						}
						sitesAfterSplit = sitesAfterSplit.concat(actualPoint.divideCell(neighbors, 0, this.randomGenerator));
				}
				//Create a copy of this generation and push it to results
				this.sites = sitesAfterSplit;
				try{
					this.diagram = voronoi.compute(this.sites, this.bbox);
				}				
				catch (err){
					logger.error(err);
					break;
				}
				this.reCalculateSites();
				this.initNeighborMatrix();
				this.setPayoffs();
				thisGenerationSites = this.sites.map(val => Object.assign({}, val)); //copy the sites list, and push it into the array
				ret.push(thisGenerationSites);
		}
		logger.debug('Simulation length: ' + ret.length + ' SitesCount: ' + this.sites.length);
		this.saveSimulationData(ret);
		return ret;
};

/**
 * NOT USED!!!
 * Checks if all cells are defecting in the current generation
 */
SimulateVoronoi.prototype.areAllCellsDefecting = function(){
	for (let i = 0; i < this.sites.length; ++i){
		if (this.sites[i].attrib == 'c')
			return false;
	}
	return true;
}

/**
 * Takes out the duplicates from the sites variable
 * Uses the cell array that is available through the voronoi class
 */
SimulateVoronoi.prototype.reCalculateSites = function(){
	//It takes out the duplicates from this.sites
	this.sites = [];
	for (let i = 0; i < this.diagram.cells.length; ++i){
		this.sites.push(new Cell(this.diagram.cells[i].site));
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
 * Sets the payoffs of all the cells
 */
SimulateVoronoi.prototype.setPayoffs = function() {
	for (var i = 0; i < this.sites.length; ++i) {
		let actualPoint = this.sites[i];
		let neighborsCount = this.getNeighborsCount(actualPoint.voronoiId);
		let cooperatingNeighbors = this.getCooperatingNeighbors(actualPoint.voronoiId);
		actualPoint.payoff = constantFunctions.payoff(cooperatingNeighbors, actualPoint.cost, neighborsCount);
		console.log(actualPoint);
		console.log(neighborsCount);
		console.log(cooperatingNeighbors);
	}
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
 * Returns a site by its VoronoiID
 * 
 * @param 	{int}  neighborID
 * @returns {site} site
 */
SimulateVoronoi.prototype.getSiteByVoronoiID = function(id){
	let len = this.sites.length;
	for (let i = 0; i < len; ++i){
		if (this.sites[i].voronoiId == id)
			return this.sites[i];
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
			let site = this.getSiteByVoronoiID(neighborsID[j]);
			this.neighborMatrix[this.sites[i].voronoiId][neighborsID[j]] = site.attrib;
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
 * Returns the count of cooperating cells in sites
 * @param 	{array} sites
 * @returns {int}
 */
SimulateVoronoi.prototype.getCooperatingCount = function(sites){
	let cooperatingSites = sites.filter(site => site.attrib == 'c');
	return cooperatingSites.length;
}

/**
 * Saves the current simulation results to the simulation.json file
 * @param {arrayOfarrays} - the `ret` from the simulation
 */
SimulateVoronoi.prototype.saveSimulationData = function(sitesList){
	let coopAndDef = [];
	for (let i = 0; i < sitesList.length; ++i){
		let cooperatingCount = this.getCooperatingCount(sitesList[i]);
		let defectingCount = sitesList[i].length - cooperatingCount;
		coopAndDef.push({
			cooperating: cooperatingCount,
			defecting: defectingCount
		})
	}
	let params = {
		generationCount: this.generationCount,
		cooperating: this.cooperatingCost,
		dist: this.dist, 
		results: coopAndDef
	}
	fs.readFile('simulation.json', 'utf8', function readFileCallback(err, data){
		if (err){
			logger.error(err);
			return;
		}
		try {
			obj = JSON.parse(data); //now it an object
		}
		catch(err){
			logger.error(err);
			obj = [];
		}
		obj.push(params);
		json = JSON.stringify(obj); //convert it back to json
		fs.writeFile('simulation.json', json, 'utf8', ()=>{}); // write it back 
	});
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
		coops = coops + constantFunctions.G[d] * gradcoops;
	}
	return coops;
}

/**
 * Export the randomGenerator to be accessed from the route
 */
SimulateVoronoi.myRandomGenerator = myRandomGenerator;

module.exports = SimulateVoronoi;
