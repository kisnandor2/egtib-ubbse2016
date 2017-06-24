const e = Math.exp(1);

class ConstantFunctions {
	/**
	 * Creates an instace of the constant functions
	 * that will be used during simulation and setting payoffs
	 * @constructor
	 */
	constructor(){
		this.G = undefined;
		this.d = undefined;
		this.dist = undefined;
		this.steepness = 20;
		this.inflexiosPontHelye = 0.5;
		this.shapeOfDif = 1/2;
		this.z = 3;
		this.limit = 0.5;
		this.maxDamage = 1.5;
	}

	/**
	 * On value change of `dist`, d is recalculated
	 * `G` is also recalculated
	 */
	set ['distance'](val){
		this.d = val * this.shapeOfDif;
		this.dist = val;
		this.calculateDiffGradient();
	}

    /**
     * setter for `limit`
     */
    setLimit(cooperalingLimit){
    	this.limit = cooperalingLimit;
	}

	/**
	 * Sigmoid function - see ConstantFunctions.V function
	 * @returns {float}
	 */
	g(i) {
		return 1 / (1 + Math.pow(e, (-this.z * (i - this.d) / this.dist)));
	}

	/**
	 * Builds a up an array that is used at the distance calculation
	 * @param {int} dist - distance that will be used during this simulation
	 */
	calculateDiffGradient() {
		this.G = new Array(this.dist);
		this.G[0] = 1;
		for (var i = 1; i < this.dist; ++i) {
			this.G[i] = 1 - ( ( this.g(i) - this.g(0) ) / ( this.g(this.dist) - this.g(0) ) );
		}
	}

	/**
	 * Sigmoid function used here - see Cooperation among cancer cells as public goods games on Voronoi networks - Marco Archetti
	 * @returns {float}
	 */
	V(i, neighborsCount) {
		return 1 / (1 + Math.pow(e, (-this.steepness * (i - this.inflexiosPontHelye)) / neighborsCount));
	}

	/**
	 * Function used for calculating the actual payoff value
	 *
	 * @param {int} 	cooperatingNeighborsCount
	 * @param {float} cost
	 * @param {int} 	neighborsCount
	 * @returns {float} payoff
	 */
	l1(j, neighborsCount){
		return 1/ (1 + Math.pow(e, (this.steepness *(this.inflexiosPontHelye - ((j/neighborsCount)/this.limit)))));
	}

	l2(j,neighborsCount, maxDamage){
		return maxDamage/(1 + Math.pow(e, (this.steepness * (this.inflexiosPontHelye - ((j/neighborsCount - this.limit) / (1 - this.limit))))));
	}


	payoff(cooperatingNeighborsCount, cost, neighborsCount) {
		return (this.V(cooperatingNeighborsCount, neighborsCount) - this.V(0, neighborsCount)) / (this.V(neighborsCount, neighborsCount) - this.V(0, neighborsCount)) - cost;
	}

	payoffBelowLimit(cooperatingNeighborsCount, cost,neighborsCount){
		return (this.l1(cooperatingNeighborsCount, neighborsCount) - this.l1(0, neighborsCount))/(this.l1(this.limit* neighborsCount, neighborsCount) - this.l1(0, neighborsCount)) - cost;
	}
	payoffOverLimit(cooperatingNeighborsCount, cost, neighborsCount){
		return (this.l2(cooperatingNeighborsCount, neighborsCount, this.maxDamage) - this.l2(0, neighborsCount,this.maxDamage))/(this.l2(neighborsCount, neighborsCount,1) - this.l2(this.limit*neighborsCount,neighborsCount,1)) - cost;
	}

}

module.exports = ConstantFunctions;