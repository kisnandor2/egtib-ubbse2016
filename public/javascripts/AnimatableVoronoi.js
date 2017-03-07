function AnimatableVoronoi(view) {
	this.voronoi = new Voronoi();
	this.cooperatorColor = new paper.Color(0.95,0.38,0.02); //#f36205
	this.defectorColor = new paper.Color(0.18,0.59,0.85); //#2f98da
	this.spotColor = new paper.Color('red');
	this.selected = false;
	this.sites = [];
	this.sitesWithColor = [];
	this.view = view;
	this.margin = 0;

	this.oldSize = view.size;
	this.mousePos = view.center;

	this.diagram = undefined;

	this.cooperatingChance = 0.5;

	this.gen_count = 0;
	this.coop_cost = 0;
	this.dist = 0;

	this.chart = {};
	this.chart.productive = [];
	this.chart.nonProductive = [];
	this.categories = [];

	this.onResize();
}

AnimatableVoronoi.prototype.displayChartData =  function(){
	if (this.categories.length == 0){
		this.categories.push(1);
	}
	else {
		this.categories.push(this.categories[this.categories.length-1] + 1);
	}
	chart.series[0].setData(this.chart.productive);
	chart.series[1].setData(this.chart.nonProductive);
	chart.series[2].setData([]);	//not sure why but sometimes the chart needs this to work correctly
	chart.series[2].setData(this.chart.nonProductive);
	chart.xAxis[0].setCategories(this.categories);
}

AnimatableVoronoi.prototype.addDataToChart = function(){
	let p = this.getProductiveCount();
	this.chart.productive.push(p);
	let n = this.sites.length;
	this.chart.nonProductive.push(n-p);
	if (this.categories.length <= this.gen_count) {
		this.displayChartData();
	}
}

AnimatableVoronoi.prototype.getProductiveCount = function() {
	let k = 0;
	for (let i = 0; i < this.sites.length; ++i){
		if (this.sites[i].attrib == 'c')
			++k;
	}
	return k;
}

AnimatableVoronoi.prototype.resetChart = function(chart) {
	this.chart.productive = [];
	this.chart.nonProductive = [];
	chart.xAxis[0].categories = [];
	this.categories = [];
}

AnimatableVoronoi.prototype.sitesBadFormatToPointFormat = function(sitesBadFormat) {
	//Changes the badly formatted sites taken from the server to be able to animate it
	let ret = [];
	for (let i in sitesBadFormat) {
		let point = sitesBadFormat[i];
		ret.push(new paper.Point(point.x, point.y, point.attrib));
	}
	return ret;
}


AnimatableVoronoi.prototype.changeColor = function(x,y){
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

AnimatableVoronoi.prototype.onMouseDown = function(x,y,attrib) {
	let oldPoint = this.changeColor(x,y);
	console.log(oldPoint);
	// let newPoint = new paper.Point(x,y,attrib);
	// console.log(newPoint);
	// this.sites.push(newPoint);
	// this.renderDiagram();
	// let p = ;
	// p.attrib = 'd';
	// this.setSites(this.sites);
	// this.renderDiagram();
}

AnimatableVoronoi.prototype.onMouseMove = function(x,y,attrib,count) {
	this.mousePos = new paper.Point(x,y,attrib);;
	if(count == 0)
		this.sites.push(new paper.Point(x,y,attrib));
	this.sites[this.sites.length - 1] = new paper.Point(x,y,attrib);
	this.setSites(this.sites);
	this.renderDiagram();
}

AnimatableVoronoi.prototype.renderDiagram = function() {
	project.activeLayer.removeChildren();
	this.diagram = this.voronoi.compute(this.sites, this.bbox);
	let diagram = this.diagram;
	if (diagram) {
		for (let i = 0, l = this.sites.length; i < l; i++) {
			let cell = diagram.cells[this.sites[i].voronoiId];
			if (cell) {
				let halfedges = cell.halfedges,
					length = halfedges.length;
				if (length > 2) {
					let points = [];
					for (let j = 0; j < length; j++) {
						let v = halfedges[j].getEndpoint();
						v.attrib = this.getPointAttribute(halfedges[j].site);
						points.push(new paper.Point(v));
					}
					this.createPath(points, this.sites[i]);
				}
			}
		}
	}
}

AnimatableVoronoi.prototype.getPointAttribute = function(point) {
	//Get the color attribute of a point when rendering the diagram
	for (var i in this.sitesWithColor) {
		var p = this.sitesWithColor[i];
		if (p.x == point.x && p.y == point.y) {
			return p.attrib;
		}
	}
}


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
			if (Math.random() <= this.cooperatingChance)
				attrib = 'c';
			else
				attrib = 'd';
			point.attrib = attrib;
			points.push(point);
		}
	}
	return points;
}

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

AnimatableVoronoi.prototype.onResize = function() {
	this.bbox = {
		xl: this.margin,
		xr: this.view.bounds.width - this.margin,
		yt: this.margin,
		yb: this.view.bounds.height - this.margin
	};
	for (var i = 0, l = this.sites.length; i < l; i++) {
		this.sites[i] = this.sites[i].multiply(view.size.divide(oldSize));
	}
	oldSize = this.view.size;
	this.renderDiagram();
}

AnimatableVoronoi.prototype.onKeyDown = function(event) {
	if (event.key == 'space') {
		this.selected = !this.selected;
		this.renderDiagram();
	}
}

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

AnimatableVoronoi.prototype.getBbox = function() {
	return this.bbox;
}

AnimatableVoronoi.prototype.getSites = function(){
	return this.sites;
}

AnimatableVoronoi.prototype.setNonCooperatingChance = function(chance){
	if (chance == undefined || isNaN(chance)){
		throw "Invalid chance value";
	}
	if (chance < 0 || chance > 1)
		this.cooperatingChance = 0.5;
	else
		this.cooperatingChance = 1-chance;
}

AnimatableVoronoi.prototype.getGen_Count = function(){
	return this.gen_count;
}

AnimatableVoronoi.prototype.setGen_Count = function(gen_count){
	this.gen_count = gen_count;
}

AnimatableVoronoi.prototype.testNeighborCount = function(){
	console.log('testing ' + this.sites.length);
	for (var i = 0; i < this.sites.length; ++i){
		let neighbors =  this.getNeighbors(this.sites[i], this.diagram);
		console.log(neighbors.length);
		if (neighbors.length == 0)
			console.log(i);
	}
}

AnimatableVoronoi.prototype.getNeighbors = function(p, diagram) {
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

AnimatableVoronoi.prototype.getCellBySite = function(point, cells) {
	//returns the cell which site is equal to point
	for (var i in cells) {
		if (this.compareSites(cells[i].site, point)) return cells[i];
	}
}

AnimatableVoronoi.prototype.compareSites = function(s1, s2) {
	if (s1.x == s2.x && s1.y == s2.y) return true;
	return false;
}

AnimatableVoronoi.prototype.setDist = function(dist){
	this.dist = dist;
}

AnimatableVoronoi.prototype.getDist = function() {
	return this.dist;
}

AnimatableVoronoi.prototype.setCoop_Cost = function(coop_cost){
	this.coop_cost = coop_cost;
}

AnimatableVoronoi.prototype.getCoop_Cost = function(){
	return this.coop_cost;
}
