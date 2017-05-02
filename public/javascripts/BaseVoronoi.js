class BaseVoronoi{
	/**
	 * BaseVoronoi class used for storing data
	 * @constructor
	 */
	constructor(){
		this.voronoi = new Voronoi();
		this.sites = [];

		this.diagram = undefined;

		this.dist = 0;
		this.coop_cost = 0;
		this.totalNumberOfCells = 0;
		this.percentOfDefectingCells = 0;
		this.cooperatingChance = 0.5;
		this.height = 1000;
		this.width = 1000;

		this.chart = {};
		this.sitesList = [];
		this.bbox = {
			xl: 0,
			xr: this.height,
			yt: 0,
			yb: this.width
		};
	}
	/**
	 * Get the productive, nonproductive and categories list to be rendered on a chart
	 */
	getSimulationResults(sitesList){
		let productive = [],
				nonproductive = [],
				categories = [];
		sitesList.unshift(this.sites);
		for (let i = 0; i < sitesList.length; ++i){
			categories.push(i);
			let prod = this.getProductiveCount(sitesList[i])/sitesList[i].length;
			productive.push(prod);
			nonproductive.push(1 - prod);
		}
		return {
			numberProductive: productive,
			numberNonProductive: nonproductive,
			categories: categories
		}
	}
	/**
	 * How many 'c' cell are in the current list
	 *
	 * @param 	{array} sites
	 * @returns {int} - count of 'c' cells
	 */
	getProductiveCount(sites) {
		let k = 0;
		for (let i = 0; i < sites.length; ++i){
			if (sites[i].attrib == 'c')
				++k;
		}
		return k;
	}

	/**
	 * Refactors the sites gotten from the server to paper.Point class
	 *
	 * @param 	{array} badlyFormattedSites - gotten from the server side
	 * @returns {array} sites 							- paper.Point class format siteList
	 */
	sitesBadFormatToPointFormat(sitesBadFormat) {
		//Changes the badly formatted sites taken from the server to be able to animate it
		let ret = [];
		for (let i in sitesBadFormat) {
			let point = sitesBadFormat[i];
			ret.push(new paper.Point(point.x, point.y, point.attrib));
		}
		return ret;
	}

	/**
	 * Takes care of setting the sites, without manually calling the genBeeHive func
	 */
	generateNewSites(){
		this.sites = this.generateBeeHivePoints(new paper.Size(Math.floor(Math.sqrt(this.totalNumberOfCells)), Math.ceil(Math.sqrt(this.totalNumberOfCells))), true)
	}

	/**
	 * Generates a new voronoi diagram which has the shape of a BeeHive
	 * It's a static size
	 *
	 * @param 	{int}	 	size 	- sqrt(how many cells needed)
	 * @param 	{bool} 	loose	- if true, the cells are not so strictly displayed
	 * @returns {array} sites
	 */
	generateBeeHivePoints(size, loose) {
		//used to generate the sites[] for a window
		let view = {};
		view.size = new paper.Size(this.width/size.width, this.height/size.height);
		let points = [];
		let col = view.size.divide(size);
		for (let i = 0; i < size.width; i++) {
			for (let j = 0; j < size.height; j++) {
				let point = new paper.Point(i, j).divide(new paper.Point(size)).multiply(view.size).add(col.divide(2));
				if (j % 2)
					point = point.add(new paper.Point(col.width / 2, 0));
				if (loose)
					point = point.add((col.divide(4)).multiply(paper.Point.random()).subtract(col.divide(4)));
				let attrib = undefined;
				if (Math.random() <= this.percentOfDefectingCells/100)
					attrib = 'd';
				else
					attrib = 'c';
				point.attrib = attrib;
				points.push(point);
			}
		}
		return points;
	}

	/**
	 * Sets the sites of this
	 *
	 * @param {array} sites
	 */
	setSites(sites) {
		if (sites.length > 0 && sites[0].constructor.name == 'Array'){
			sitesGoodFormat = [];
			for (let i = 0; i < sites.length; ++i){
				sitesGoodFormat.push(new paper.Point(sites[i][1], sites[i][2], sites[i][3]));
			}
			sites = sitesGoodFormat;
		}
		else if (sites.length > 0 && sites[0].constructor.name != 'Point'){
			console.log('Unsuported format');
		}
		this.sites = sites;
		this.sitesWithColor = sites.slice(0);
	}

	/**
	 * Get the bbox of this
	 * @returns {object}
	 */
	getBbox() {
		return this.bbox;
	}

	/**
	 * Get the sites of this
	 * @returns {array}
	 */
	getSites(){
		return this.sites;
	}

	/**
	 * Get the generation count of this
	 * @retunrs {int}
	 */
	getGen_Count(){
		return this.gen_count;
	}

	/**
	 * Set the generation count
	 * @param {int} gen_count
	 */
	setGen_Count(gen_count){
		if (gen_count <= 0)
			return;
		this.gen_count = gen_count;
	}

	/**
	 * Get the neighbors of a point. Use it only for DEBUGGING!
	 */
	getNeighbors(p, diagram) {
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

	/**
	 * Finds a cell by a site coordinate. Use int only for DEBUGGING!
	 */
	getCellBySite(point, cells) {
		//returns the cell which site is equal to point
		for (var i in cells) {
			if (this.compareSites(cells[i].site, point)) return cells[i];
		}
	}

	/**
	 * Checks if two sites are equal. Use it only for DEBUGGING!
	 */
	compareSites(s1, s2) {
		if (s1.x == s2.x && s1.y == s2.y) return true;
		return false;
	}

	/**
	 * Set the distance of interaction of this
	 * @param {int} dist
	 */
	setDist(dist){
		if (dist < 0 || dist > 5)
			return;
		this.dist = dist;
	}

	/**
	 * Get the distance of interaction of this
	 * @returns {int}

	 */
	getDist() {
		return this.dist;
	}

	/**
	 * Set the cooperating cost of this
	 * @param {float} coop_cost
	 */
	setCoop_Cost(coop_cost){
		if (coop_cost < 0 || coop_cost > 1)
			return;
		this.coop_cost = coop_cost;
	}

	/**
	 * Get the cooperating cost of this
	 * @returns {float}
	 */
	getCoop_Cost(){
		return this.coop_cost;
	}

	/**
	 * Set the totabl number of cells that are rendered
	 * @param {int} value
	 */
	setTotalNumberOfCells(value){
		if (value <2 || value > 2500)
			return;
		this.totalNumberOfCells = value;
	}

	/**
	 * Set the percent of defecting cells
	 * @param {float} value
	 */
	setPercentOfDefectingCells(value){
		if (value < 0 || value > 100)
			return;
		this.percentOfDefectingCells = value;
	}
}
