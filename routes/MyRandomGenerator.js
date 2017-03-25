/**
 * Saves all the random numbers across multiple simulations in order to be reused
 * @consturctor
 */
function MyRandomGenerator(){
	this.randomList = [];
	this.lastIndex = 0;
}

/**
 * Get a random number
 * @return {float}
 */
MyRandomGenerator.prototype.random = function() {
	let rand = this.randomList[this.lastIndex];
	if (rand == undefined){
		rand = Math.random();
		this.randomList.push(rand);
	}
	this.lastIndex++;
	return rand;
};

/**
 * If simulation is restarted, restart the seed from 0 with this function
 */
MyRandomGenerator.prototype.resetSeed = function(index){
	this.randomList = [];
	this.lastIndex = 0;
}

module.exports = MyRandomGenerator;