class Cell {
	/**
	 * Creates a cell object that will be used in the sites array
	 * @constructor
	 */
	constructor({x, y, attrib, cost, bbox, voronoiId}) {
		this.x = x;
		this.y = y;
		this.attrib = attrib;
		this.cost = cost;
		this.colorChangeChance = 0.02;
		this.bbox = bbox;
		this.payoff = undefined;
		this.voronoiId = voronoiId;
	}

	/**
	 * Divides a cell in two smaller cells
	 *
	 * @param {array} neighbors - the neighbors of the point(used for calculating the new points)
	 * @param {float}	divChance - the chance that this cell will divide
	 * @param {Object} randomGenerator - the generator that will be used at generating random number
	 * @returns {array} dividingResult - an array with one or two cells
	 */
	divideCell(neighbors, divChance, randomGenerator){
		let ret = [];
		//Check if division is needed
		if (randomGenerator.random() < divChance) {
			//Find X coordinate to divide
			let min = 9999,
				shiftOnX = 0,
				shiftOnY = 0;
			for (let i in neighbors){
				if (Math.abs(neighbors[i].y - this.y) < min){
					shiftOnX = Math.abs(neighbors[i].x - this.x)/4;
					min = Math.abs(neighbors[i].y - this.y);
				}
			}
			//Check if X is valid
			if (shiftOnX + this.x > this.bbox.xr)
				shiftOnX = (this.bbox.xr - this.x)/2
			if (this.x - shiftOnX < 0){
				shiftOnX = this.x/2;
			}
			//Generate Y coordinate
			shiftOnY = Math.random() * 50;
			if (Math.random() < 0.5){
				shiftOnY = -shiftOnY;
			}
			//Check if Y is valid
			if (this.y - shiftOnY < 0 ||
					this.y + shiftOnY < 0 ||
					this.y - shiftOnY > this.bbox.yb ||
					this.y + shiftOnY > this.bbox.yb){
				shiftOnY = 0;
			}
			//Acutal dividing
			let newPoint1 = new Cell({
				x: this.x - shiftOnX,
				y: this.y - shiftOnY,
				attrib: this.attrib,
				cost: this.cost,
				bbox: this.bbox
			})
			let newPoint2 = new Cell({
				x: this.x + shiftOnX,
				y: this.y + shiftOnY,
				attrib: this.attrib,
				cost: this.cost,
				bbox: this.bbox
			})
			//Change color! Only one of them may change it's color
			if (Math.random() < this.colorChangeChance){
				this.changeColor(newPoint1);
			}
			else if (Math.random() < this.colorChangeChance){
				this.changeColor(newPoint2);
			}
			ret.push(newPoint1);
			ret.push(newPoint2);
		}
		else {
			//Insert the point as it is
			ret.push(this);
		}
		return ret;
	}

	/**
	 * Changes the color of this cell
	 */
	changeColor(){
		if (this.attrib = 'c')
			this.attrib = 'd';
		else
			this.attrib = 'c';
	}
}

module.exports = Cell;