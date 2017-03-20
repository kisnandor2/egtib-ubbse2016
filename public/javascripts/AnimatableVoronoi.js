/**
 * AnimatableVoronoi class used for rendering the voronoi graph, it's results to chart, and changing the progressBar
 * Maybe the chart and progressBar should be moved to a controller...?
 * @constructor
 * 
 * @param {view} 		view		- after paper.install this is accessible
 * @param {context} context	- canvas.context
 */
function AnimatableVoronoi(view, context) {
	this.voronoi = new Voronoi();
	this.cooperatorColor = new paper.Color(0.95,0.38,0.02); //#f36205
	this.defectorColor = new paper.Color(0.18,0.59,0.85); //#2f98da
	this.sites = [];
	this.view = view;
	this.margin = 0;

	this.oldSize = view.size;
	this.mousePos = view.center;

	this.diagram = undefined;

	this.dist = 0;
	this.coop_cost = 0;
	this.totalNumberOfCells = 0;
	this.percentOfDefectingCells = 0;
	this.progressBar = 0;
	this.cooperatingChance = 0.5;

	this.chart = {};
	this.sitesList = [];
	this.toBeRendered = -9999;
	this.savedToBeRendered = -9999;

	this.context = context;

	this.bbox = {
		xl: this.margin,
		xr: this.view.bounds.width - this.margin,
		yt: this.margin,
		yb: this.view.bounds.height - this.margin
	};
}

/**
 * Displays the data which was added to this.chart.series and xAxis
 */
AnimatableVoronoi.prototype.displayChartData =  function(){
	this.chart.series[0].setData(this.chart.productive);
	this.chart.series[1].setData(this.chart.nonProductive);
	this.chart.series[2].setData([]);	//not sure why but sometimes the chart needs this to work correctly
	this.chart.series[2].setData(this.chart.nonProductive);
	this.chart.xAxis[0].setCategories(this.categories);
}

/**
 * Adds data to chart
 *
 * @param {array} sites - the sites where we calculate the chart data
 * @param {int}		i 		- this sets the categories(bottom part) of the chart
 */ 
AnimatableVoronoi.prototype.addDataToChart = function(sites, i){
	let p = this.getProductiveCount(sites);
	this.chart.productive.push(p);
	let n = sites.length;
	this.chart.nonProductive.push(n-p);
	this.chart.categories.push(i);
}

/**
 * How many 'c' cell are in the current list
 *
 * @param 	{array} sites
 * @returns {int} - count of 'c' cells
 */
AnimatableVoronoi.prototype.getProductiveCount = function(sites) {
	let k = 0;
	for (let i = 0; i < sites.length; ++i){
		if (sites[i].attrib == 'c')
			++k;
	}
	return k;
}

/**
 * Resets the data in the chart, everything is lost
 */
AnimatableVoronoi.prototype.resetChart = function() {
	this.chart.productive = [];
	this.chart.nonProductive = [];
	this.chart.categories = [];
}

/**
 * Refactors the sites gotten from the server to paper.Point class
 *
 * @param 	{array} badlyFormattedSites - gotten from the server side
 * @returns {array} sites 							- paper.Point class format siteList
 */
AnimatableVoronoi.prototype.sitesBadFormatToPointFormat = function(sitesBadFormat) {
	//Changes the badly formatted sites taken from the server to be able to animate it
	let ret = [];
	for (let i in sitesBadFormat) {
		let point = sitesBadFormat[i];
		ret.push(new paper.Point(point.x, point.y, point.attrib));
	}
	return ret;
}

/**
 * As the name describes it! USE IT ONLY FOR DEBUGGING!!!
 */
AnimatableVoronoi.prototype.getPointAtXY = function(x,y){
	//TODO: Use diagram.getCellBySite
	let min = 9999;
	let p = undefined;
	for (point of this.sites){
		let dist = Math.sqrt(Math.pow(point.x-x,2) + Math.pow(point.y-y,2));
		if (dist < min && dist != 0){
			min = dist;
			p = point;
		}
	}
	return p;
}

/**
 * Changes the color of a cell that was clicked
 * Currently not in use
 * @param {int}	 x
 * @param {int}	 y
 * @param {char} attrib
 */ 
AnimatableVoronoi.prototype.onMouseDown = function(x,y,attrib) {
	let oldPoint = this.getPointAtXY(x,y);
	oldPoint.attrib = 'd';
	this.renderDiagram();
}

/**
 * Makes it able to insert a new point at the desired location, with animated canvas
 * Slow motion => Don't use it
 */
AnimatableVoronoi.prototype.onMouseMove = function(x,y,attrib,count) {
	//TODO: No need for this
	this.mousePos = new paper.Point(x,y,attrib);;
	if(count == 0)
		this.sites.push(new paper.Point(x,y,attrib));
	this.sites[this.sites.length - 1] = new paper.Point(x,y,attrib);
	this.setSites(this.sites);
	this.renderDiagram();
}

/**
 * Renders the diagram which is described by this.sites
 */
AnimatableVoronoi.prototype.renderDiagram = function() {
	project.activeLayer.removeChildren();
	this.diagram = this.voronoi.compute(this.sites, this.bbox);
	if (this.diagram) {
		for (let i = 0, l = this.sites.length; i < l; i++) {
			let cell = this.diagram.cells[this.sites[i].voronoiId];
			if (cell) {
				let halfedges = cell.halfedges,
					length = halfedges.length;
				if (length > 2) {
					let points = [];
					for (let j = 0; j < length; j++) {
						let v = halfedges[j].getEndpoint();
						// v.attrib = this.getPointAttribute(halfedges[j].site);
						v.attrib = halfedges[j].site.attrib;
						points.push(new paper.Point(v));
					}
					this.createPath(points, this.sites[i]);
				}
			}
		}
	}
	//Show the coordinates in the canvas for debugging purpose
	// for (let i in this.sites){
	// 	this.context.fillText(Math.floor(this.sites[i].x) + ", " + Math.floor(this.sites[i].y), this.sites[i].x-50, this.sites[i].y);
	// }
}

/**
 * Adds the data to chart and displays it
 * 
 * @param {array_of_sites} sitesList
 */
AnimatableVoronoi.prototype.renderChartData = function(sitesList) {
	this.resetChart();
	this.addDataToChart(this.sites, 0);
	for (let i = 0; i < sitesList.length; ++i){
		this.addDataToChart(sitesList[i], i);
	}
	this.displayChartData();
	this.sitesList = sitesList;
}

/**
 * Renders a whole animation described by this.sitesList
 */
AnimatableVoronoi.prototype.render = function() {
	this.recursiveRender(this.toBeRendered);
}

/**
 * Renders the i'th sitesList = only one generation
 * @param {int} i
 */
AnimatableVoronoi.prototype.recursiveRender = function(i){
	if (this.toBeRendered < 0)
		return;
	if (i >= sitesList.length)
		return;
	setTimeout(()=>{
		this.toBeRendered++;
		this.savedToBeRendered = this.toBeRendered;
		this.sites = this.sitesList[i];
		this.renderDiagram();
		this.updateProgressBar(i);
	}, 0)
}

/**
 * Updates the progressbar to match the progress of the animation
 * @param {int} i
 */
AnimatableVoronoi.prototype.updateProgressBar = function(i){
	let percent = 100 * (i+1)/this.sitesList.length;
	this.progressBar.style.width = percent + '%'
	$('#progressText')[0].textContent = Math.ceil(percent) + '%';
}

/**
 * Used at the rendering of a single diagram to canvas
 */
AnimatableVoronoi.prototype.removeSmallBits = function(path) {
	//WTF is this used for? TODO: document
	let averageLength = path.length / path.segments.length;
	let min = path.length / 50;
	for (let i = path.segments.length - 1; i >= 0; i--) {
		let segment = path.segments[i];
		let cur = segment.point;
		let nextSegment = segment.next;
		let next = nextSegment.point + nextSegment.handleIn;
		if (cur.getDistance(next) < min) {
			segment.remove();
		}
	}
}

/**
 * Generates a new voronoi diagram which has the shape of a BeeHive
 *
 * @param 	{int}	 	size 	- sqrt(how many cells needed)
 * @param 	{bool} 	loose	- if true, the cells are not so strictly displayed
 * @returns {array} sites
 */
AnimatableVoronoi.prototype.generateBeeHivePoints = function(size, loose) {
	//used to generate the sites[] for a window
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
 * Used at the rendering of a single diagram to canvas
 * The color of a cell that is displayed is decided here
 */
AnimatableVoronoi.prototype.createPath = function(points, center) {
	let path = new Path();
	if (!this.selected) {
		color = points[0].attrib == 'c' ? this.cooperatorColor : this.defectorColor;
		path.fillColor = color;
	} else {
		path.fullySelected = selected;
	}
	path.closed = true;

	for (let i = 0, l = points.length; i < l; i++) {
		let point = points[i];
		let next = points[(i + 1) == points.length ? 0 : i + 1];
		let vector = (next.subtract(point)).divide(2);
		path.add({
			point: point.add(vector),
			handleIn: -vector,
			handleOut: vector
		});
	}
	// console.log(path);
	path.scale(0.95);
	this.removeSmallBits(path);
	this.view.draw();
	return path;
}

/**
 * Resizes the canvas - attached to window resize event in angularController
 */
AnimatableVoronoi.prototype.onResize = function() {
	v = this.voronoiAccessibleFromOutside;
	v.bbox = {
		xl: v.margin,
		xr: v.view.bounds.width - v.margin,
		yt: v.margin,
		yb: v.view.bounds.height - v.margin
	};
	for (let i = 0; i < v.sites.length; i++) {
		let attrib = v.sites[i].attrib;
		v.sites[i] = v.sites[i].multiply(v.view.size.divide(v.oldSize));
		v.sites[i].attrib = attrib;
	}
	v.oldSize = v.view.size;
	v.renderDiagram();
}

/**
 * Sets the sites of this
 *
 * @param {array} sites
 */
AnimatableVoronoi.prototype.setSites = function(sites) {
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
AnimatableVoronoi.prototype.getBbox = function() {
	return this.bbox;
}

/**
 * Get the sites of this
 * @returns {array}
 */
AnimatableVoronoi.prototype.getSites = function(){
	return this.sites;
}

/**
 * Get the generation count of this
 * @retunrs {int}
 */
AnimatableVoronoi.prototype.getGen_Count = function(){
	return this.gen_count;
}

/**
 * Set the generation count
 * @param {int} gen_count
 */
AnimatableVoronoi.prototype.setGen_Count = function(gen_count){
	if (gen_count <= 0)
		return;
	this.gen_count = gen_count;
}

/**
 * Checks if each cell has at least one neighbor. Use it only for DEBUGGING!
 */
AnimatableVoronoi.prototype.testNeighborCount = function(){
	console.log('testing ' + this.sites.length);
	for (var i = 0; i < this.sites.length; ++i){
		let neighbors = this.getNeighbors(this.sites[i], this.diagram);
		console.log(neighbors.length);
		if (neighbors.length == 0)
			console.log(i);
	}
}

/**
 * Get the neighbors of a point. Use it only for DEBUGGING!
 */
AnimatableVoronoi.prototype.getNeighbors = function(p, diagram) {
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
AnimatableVoronoi.prototype.getCellBySite = function(point, cells) {
	//returns the cell which site is equal to point
	for (var i in cells) {
		if (this.compareSites(cells[i].site, point)) return cells[i];
	}
}

/**
 * Checks if two sites are equal. Use it only for DEBUGGING!
 */
AnimatableVoronoi.prototype.compareSites = function(s1, s2) {
	if (s1.x == s2.x && s1.y == s2.y) return true;
	return false;
}

/**
 * Set the distance of interaction of this
 * @param {int} dist
 */
AnimatableVoronoi.prototype.setDist = function(dist){
	if (dist < 0 || dist > 5)
		return;
	this.dist = dist;
}

/**
 * Get the distance of interaction of this
 * @returns {int}

 */
AnimatableVoronoi.prototype.getDist = function() {
	return this.dist;
}

/**
 * Set the cooperating cost of this
 * @param {float} coop_cost
 */
AnimatableVoronoi.prototype.setCoop_Cost = function(coop_cost){
	if (coop_cost < 0 || coop_cost > 1)
		return;
	this.coop_cost = coop_cost;
}

/**
 * Get the cooperating cost of this
 * @returns {float}
 */
AnimatableVoronoi.prototype.getCoop_Cost = function(){
	return this.coop_cost;
}

/**
 * Set the totabl number of cells that are rendered
 * @param {int} value
 */
AnimatableVoronoi.prototype.setTotalNumberOfCells = function(value){
	if (value <2 || value > 500)
		return;
	this.totalNumberOfCells = value;
}

/**
 * Set the percent of defecting cells
 * @param {float} value
 */
AnimatableVoronoi.prototype.setPercentOfDefectingCells = function(value){
	if (value < 0 || value > 100)
		return;
	this.percentOfDefectingCells = value;
}

/**
 * Set the chart which is used to display the data
 * @oaram {chart} chart
 */
AnimatableVoronoi.prototype.setChart = function(chart){
	this.chart = chart;
	this.resetChart();
}

/**
 * Set the progressBar whish is used to display rendering progress
 * @param {progressBar} p
 */
AnimatableVoronoi.prototype.setProgressBar = function(p){
	this.progressBar = p;
}
