class AnimatableVoronoi extends BaseVoronoi{
	/**
	 * AnimatableVoronoi class used for rendering the voronoi graph, it's results to chart, and changing the progressBar
	 * Maybe the chart and progressBar should be moved to a controller...?
	 * @constructor
	 * 
	 * @param {view} 		view		- after paper.install this is accessible
	 * @param {context} context	- canvas.context
	 */
	constructor(view, context){
		super();
		this.cooperatorColor = new paper.Color(0.95,0.38,0.02); //#f36205
		this.defectorColor = new paper.Color(0.18,0.59,0.85); //#2f98da
		this.view = view;
		this.margin = 0;
		this.oldSize = view.size;
		this.mousePos = view.center;
		this.progressBar = undefined;
		this.chart = {};
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
	displayChartData(){
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
	addDataToChart(sites, i){
		let p = this.getProductiveCount(sites);
		this.chart.productive.push(p);
		let n = sites.length;
		this.chart.nonProductive.push(n-p);
		this.chart.categories.push(i);
	}

	/**
	 * Resets the data in the chart, everything is lost
	 */
	resetChart() {
		this.chart.productive = [];
		this.chart.nonProductive = [];
		this.chart.categories = [];
	}

	/**
	 * As the name describes it! USE IT ONLY FOR DEBUGGING!!!
	 */
	getPointAtXY(x,y){
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
	onMouseDown(x,y,attrib) {
		let oldPoint = this.getPointAtXY(x,y);
		oldPoint.attrib = 'd';
		this.renderDiagram();
	}

	/**
	 * Makes it able to insert a new point at the desired location, with animated canvas
	 * Slow motion => Don't use it
	 */
	onMouseMove(x,y,attrib,count) {
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
	renderDiagram() {
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
	renderChartData(sitesList) {
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
	render() {
		this.recursiveRender(this.toBeRendered);
	}

	/**
	 * Renders the i'th sitesList = only one generation
	 * @param {int} i
	 */
	recursiveRender(i){
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
	updateProgressBar(i){
		let percent = 100 * (i+1)/this.sitesList.length;
		this.progressBar.style.width = percent + '%'
		$('#progressText')[0].textContent = Math.ceil(percent) + '%';
	}

	/**
	 * Used at the rendering of a single diagram to canvas
	 */
	removeSmallBits(path) {
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
	 * Used at the rendering of a single diagram to canvas
	 * The color of a cell that is displayed is decided here
	 */
	createPath(points, center) {
		let path = new Path();
		if (!this.selected) {
			let color = points[0].attrib == 'c' ? this.cooperatorColor : this.defectorColor;
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
	onResize() {
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
	 * Checks if each cell has at least one neighbor. Use it only for DEBUGGING!
	 */
	testNeighborCount(){
		console.log('testing ' + this.sites.length);
		for (var i = 0; i < this.sites.length; ++i){
			let neighbors = this.getNeighbors(this.sites[i], this.diagram);
			console.log(neighbors.length);
			if (neighbors.length == 0)
				console.log(i);
		}
	}

	/**
	 * Set the chart which is used to display the data
	 * @oaram {chart} chart
	 */
	setChart(chart){
		this.chart = chart;
		this.resetChart();
	}

	/**
	 * Set the progressBar whish is used to display rendering progress
	 * @param {progressBar} p
	 */
	setProgressBar(p){
		this.progressBar = p;
	}
}
