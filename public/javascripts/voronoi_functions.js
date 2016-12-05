function AnimatableVoronoi(view) {
	this.voronoi = new Voronoi();
	this.cooperatorColor = new paper.Color('yellow');
	this.defectorColor = new paper.Color('green');
	this.spotColor = new paper.Color('red');
	this.selected = false;
	this.sites = [];
	this.sitesWithColor = [];
	this.view = view;
	this.margin = 10;

	this.oldSize = view.size;
	this.mousePos = view.center;

	this.diagram = undefined;

	this.onResize();
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


AnimatableVoronoi.prototype.onMouseDown = function(event) {
	this.sites.push(event.point);
	this.renderDiagram();
}

AnimatableVoronoi.prototype.onMouseMove = function(event) {
	this.mousePos = event.point;
	if (event.count == 0)
		sites.push(event.point);
	this.sites[this.sites.length - 1] = event.point;
	this.renderDiagram();
}

AnimatableVoronoi.prototype.renderDiagram = function() {
	project.activeLayer.removeChildren();
	let diagram = this.voronoi.compute(this.sites, this.bbox);
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
	// console.log(col + " " + size.width + " " + size.height);
	for (let i = -1; i < size.width + 1; i++) {
		for (let j = -1; j < size.height + 1; j++) {
			let point = new paper.Point(i, j).divide(new paper.Point(size)).multiply(view.size).add(col.divide(2));
			if (j % 2)
				point = point.add(new paper.Point(col.width / 2, 0));
			if (loose)
				point = point.add((col.divide(4)).multiply(paper.Point.random()).subtract(col.divide(4)));
			let attrib = undefined;
			if (Math.random() <= 0.95)
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
	this.sites = sites;
	this.sitesWithColor = sites.slice(0);
}

AnimatableVoronoi.prototype.getBbox = function() {
	return this.bbox;
}
