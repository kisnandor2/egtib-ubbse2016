/**
 * Created by Reka on 6/19/2017.
 */
const voronoi = new (require('../public/javascripts/voronoi_core'))();
const logger = require('./logger');
const Timer = require('../public/javascripts/timer');
const fs = require('fs');
const constantFunctions = new (require('./ConstantFunctions'))();
const MongoClient = require('mongodb').MongoClient;
const Cell = require('./Cell')

var MongoURI = null;
if (process.env.MONGODB_URI){
    MongoURI = process.env.MONGODB_URI;
}
else{
    MongoURI = "mongodb://localhost:27017";
}
MongoURI += "/egtib";

const alfa = 0.1; //dividing chance constant
const e = Math.exp(1);
/**
 * SimulateVoronoi Class - allows us to simulate using voronoi diagram
 * @constructor
 */
function SimulateVoronoiTwoBjs() {
    this.diagram 						= undefined;
    this.dist               = undefined;
    this.cooperatingCost    = undefined;
    this.itShouldDivide		= undefined;
    this.defectingCost      = 0;
    this.cooperatingLimit   = undefined;
    this.percentageDef      = undefined;

    constantFunctions.dist = 1;
    this.sites = [];
    this.bbox = {};
    this.neighborMatrix = [];

    logger.debug("new SimulateVoronoiTwoBjs created");
    // this.timer = new Timer(this);
}

/**
 * Initialize the randomGenerator based on ID
 * Used for generating the same simulation as many times as needed with different parameters
 * @param {int} randomGeneratorID
 * @returns {randomGenerator}
 */
SimulateVoronoiTwoBjs.prototype.swtichRandomGenerator = function(randomGeneratorID) {
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
SimulateVoronoiTwoBjs.prototype.getDividingChance = function(time){
    let K = this.x0 * 2;
    let x0 = this.x0;
    let numberOfCellsWeWant = Math.ceil(K*(Math.pow(x0/K,Math.pow(e,-alfa*time))));
    let chance = numberOfCellsWeWant / this.sites.length - 1;
    return chance;
}

/**
 * Builds up a SimulateVoronoiTwoBjs from client data
 *
 * @param {array} sites 		- Diagram sites coordinates(ex. [{x:5,y:5},{},...])
 * @param {object} bbox  		- Coordinates(top,bot on X and Y) of the ractangle where it was drawn
 * @param {int} gen_count 	- Generation count for the simulation
 * @param {float} coop_cost - Cost of a cooperating cell(between 0 and 1)
 * @param {int} dist 				- Distance of interaction used in the simulation
 */
SimulateVoronoiTwoBjs.prototype.init = function({ sites, bbox, gen_count, coop_cost, dist, itShouldDivide, cooperatingLimit, constantParameters }) {
    logger.info('Init voronoi from the client data');
    logger.debug('Client data: ', {sites_count: sites.length, bbox, gen_count, coop_cost, dist, cooperatingLimit});

    if (!sites){
        logger.error("No site in Sites, probably testing");
        return;
    }

    this.sites = [];
    this.bbox = bbox;
    this.generationCount = gen_count;
    this.cooperatingCost = coop_cost;
    this.dist = dist;
    this.itShouldDivide = itShouldDivide;
    this.cooperatingLimit = cooperatingLimit;

    if (constantParameters){ //set if there is what to set
        console.log(constantParameters);
        if (constantParameters.steepness != undefined){
            this.setConstantFunctions(constantParameters)
        } else {
            this.setConstantFunctionsExt(constantParameters)
        }

    }

    constantFunctions.distance = dist;
    constantFunctions.setLimit(cooperatingLimit);

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
 * Set the constant values of the ConstantFunctions
 * Used when accessing simulaition from the simulateWithoutDiagram page
 * parameters - a lot :)
 */
SimulateVoronoiTwoBjs.prototype.setConstantFunctions = function({steepness, inflexiosPontHelye, shapeOfDif, z}){
    constantFunctions.steepness = steepness;
    constantFunctions.inflexiosPontHelye = inflexiosPontHelye;
    constantFunctions.shapeOfDif = shapeOfDif;
    constantFunctions.z = z;
}
SimulateVoronoiTwoBjs.prototype.setConstantFunctionsExt = function({steepness1, inflexiosPontHelye1, steepness2, inflexiosPontHelye2, shapeOfDif, z}){
    constantFunctions.steepness1 = steepness1;
    constantFunctions.inflexiosPontHelye1 = inflexiosPontHelye1;
    constantFunctions.steepness2 = steepness2;
    constantFunctions.inflexiosPontHelye2 = inflexiosPontHelye2;
    constantFunctions.shapeOfDif = shapeOfDif;
    constantFunctions.z = z;
}

/**
 * Simulates using the parameters set in the init function
 */
SimulateVoronoiTwoBjs.prototype.simulate = function() {
    if (!this.sites){
        logger.error("No this.sites, probably testing");
        return [];
    }
    const testCoopCount = this.getCooperatingCount(this.sites);
    this.percentageDef = 1 - testCoopCount/this.sites.length;
    var ret = [];
    // ret.push(JSON.parse(JSON.stringify(this.sites)));
    for (let j = 0; j < this.generationCount; ++j) {
        let sitesAfterSplit = [];
        let divChance = this.getDividingChance(j+1);
        for (let i = 0; i < this.sites.length; ++i) {
            //Select a random neighbor and change payoffs if needed
            actualPoint = this.sites[i]
            let neighbors = this.getNeighbors(actualPoint);
            let rand = Math.round(Math.random() * (neighbors.length-1));
            try {
                if (neighbors[rand].attrib != actualPoint.attrib && neighbors[rand].payoff > actualPoint.payoff) {
                    actualPoint.attrib = neighbors[rand].attrib;//neighborMatrix[actualPoint.voronoiId][neighbors[rand].voronoiId];
                    actualPoint.cost = neighbors[rand].cost;
                }
            } catch (error) {
                logger.error('No neighbors found at: ', i);
                logger.error('X: ' + actualPoint.x + ' Y:' + actualPoint.y);
                logger.error('Rand: ' + rand + ' neighborsCount: ' + neighbors.length);
            }
            if (this.itShouldDivide){
                sitesAfterSplit = sitesAfterSplit.concat(actualPoint.divideCell(neighbors, divChance));
            }
        }
        //Create a copy of this generation and push it to results
        if (this.itShouldDivide){
            this.sites = sitesAfterSplit;
        }
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
        // thisGenerationSites = this.sites.map(val => Object.assign({}, val)); //copy the sites list, and push it into the array
        ret.push(JSON.parse(JSON.stringify(this.sites)));
    }
    logger.debug('Simulation length: ' + ret.length + ' SitesCount: ' + this.sites.length);
    return ret;
};

/**
 * NOT USED!!!
 * Checks if all cells are defecting in the current generation
 */
SimulateVoronoiTwoBjs.prototype.areAllCellsDefecting = function(){
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
SimulateVoronoiTwoBjs.prototype.reCalculateSites = function(){
    //It takes out the duplicates from this.sites
    this.sites = [];
    for (let i = 0; i < this.diagram.cells.length; ++i){
        this.sites.push(new Cell(this.diagram.cells[i].site));
    }
}

/**
 * Tests if every site has a voronoiId
 */
SimulateVoronoiTwoBjs.prototype.checkVoronoiId = function() {
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
SimulateVoronoiTwoBjs.prototype.setPayoffs = function() {
    for (var i = 0; i < this.sites.length; ++i) {
        let actualPoint = this.sites[i];
        let neighbors = this.getCooperatingNeighbors(actualPoint.voronoiId);
        if (neighbors.coops < this.limit * neighbors.neighborsCount) {
            actualPoint.payoff = constantFunctions.payoffBelowLimit(neighbors.coops/neighbors.neighborsCount, actualPoint.cost,1);
        } else {
            actualPoint.payoff = constantFunctions.payoffOverLimit(neighbors.coops/neighbors.neighborsCount, actualPoint.cost, 1);
        }
    }
}

/**
 * Finds a cell by a site coordinate
 *
 * @returns {cell} - the cell which site is equal to point
 */
SimulateVoronoiTwoBjs.prototype.getCellBySite = function(point, cells) {
    for (let i = 0; i < cells.length; ++i) {
        if (this.compareSites(point, cells[i].site))
            return cells[i];
    }
}

SimulateVoronoiTwoBjs.prototype.compareSites = function(site1, site2){
    if (site1.x == site2.x && site1.y == site2.y)
        return true;
    return false;
}

/**
 * Tests if every cell has at least one neighbor
 */
SimulateVoronoiTwoBjs.prototype.testNeighborCount = function() {
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
SimulateVoronoiTwoBjs.prototype.getSiteByVoronoiID = function(id){
    let len = this.sites.length;
    for (let i = 0; i < len; ++i){
        if (this.sites[i].voronoiId == id)
            return this.sites[i];
    }
}

/**
 * Builds up the neighbor matrix which is used to speed up finding a cells neighbors
 */
SimulateVoronoiTwoBjs.prototype.initNeighborMatrix = function() {
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
SimulateVoronoiTwoBjs.prototype.getNeighbors = function(p) {
    //Find neighbors of cell which has site at p point
    let neighbors = [];
    let voronoiId = p.voronoiId;
    for (let i = 0; i < this.neighborMatrix.length; ++i){
        if (this.neighborMatrix[voronoiId][i] != 0){
            neighbors.push(this.getSiteByVoronoiID(i));
        }
    }
    return neighbors;
}

/**
 * Counts the neighbors of a point/site/cell
 *
 * @param 	{int} index	 - the index(voronoiId) of a point/site/cell
 * @returns {int}			 - total number of neighbors
 */
SimulateVoronoiTwoBjs.prototype.getNeighborsCount = function(index) {
    let count = 0;
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
SimulateVoronoiTwoBjs.prototype.getCooperatingCount = function(sites){
    let cooperatingSites = sites.filter(site => site.attrib == 'c');
    return cooperatingSites.length;
}


/**
 * Saves the current simulation results to the simulation.json file
 * @param {arrayOfarrays} - the `ret` from the simulation
 */
SimulateVoronoiTwoBjs.prototype.saveSimulationData = function(sitesList){
    if (sitesList[0].length < 100){
        logger.trace('No need to save simulation. Total cells is out of range');
        return;
    }
    // if (percentageDef <= 0.01 || percentageDef >= 0.1){
    //  logger.trace('No need to save simulation. percentageDef is out of range');
    //  return;
    // }
    if (this.generationCount < 5){
        logger.trace('No need to save simulation. gen_count is too small');
        return; 
    }
    // if (this.cooperatingCost <= 0.01 || this.cooperatingCost > 0.2){
    //  logger.trace('No need to save simulation. cooperatingCost is out of range');
    //  return;
    // }

    let coopAndDef = [];
    for (let i = 0; i < sitesList.length; ++i){
        let cooperatingCount = this.getCooperatingCount(sitesList[i]);
        let defectingCount = sitesList[i].length - cooperatingCount;
        coopAndDef.push({
            cooperating: cooperatingCount,
            defecting: defectingCount
        })
    }

    let params = {}
    try{
    	params = {
        generationCount: parseFloat(this.generationCount),
        cooperatingCost: parseFloat(this.cooperatingCost),
        percentageDef: parseFloat(this.percentageDef),
        dist: parseFloat(this.dist),
        itShouldDivide: this.itShouldDivide,
        cooperatingLimit: parseFloat(this.cooperatingLimit),
        results: coopAndDef,
        warburg: true
    	}
    }
    catch(err){
    	logger.error(err);
    	return;
    }
    // Connect to the db
    MongoClient.connect(MongoURI, function(err, db) {
      if(err) {
        logger.error(err); 
        return;
      }
      db.collection("egtib").insert(params, {w:1}, function(err, result) {
        if (err){
            logger.error(err);
            return;
        }
        logger.trace("1 simulation inserted into MongoDB");
        db.close();
      });
    });
}

/**
 * Counts the cooperating neighbors of a point/site/cell
 * Distance is taken in consideration
 *
 * @param 	{int} k	- the index(voronoiId) of a point/site/cell
 * @returns {int} 	- total number of cooperating neighbors
 */
SimulateVoronoiTwoBjs.prototype.getCooperatingNeighbors = function(k) {
    var neighbors = [];
    neighbors.push(k);

    let allNeighborsCount = 0;

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
        allNeighborsCount += neighbors.length * constantFunctions.G[d];
        coops = coops + constantFunctions.G[d] * gradcoops;
    }
    return {
        coops,
        neighborsCount: allNeighborsCount
    };
}

module.exports = SimulateVoronoiTwoBjs;
