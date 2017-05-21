const chai = require('chai');
const assert = chai.assert;
const e = Math.exp(1);

const ConstantFunctions = require('../routes/ConstantFunctions');
const logger = require('../routes/logger');
logger.setLevel('OFF');

describe('ConstantFunctions', function() {

	describe('testing default construnctor and distance setter', function() {
		it('Before set the dist should be undefined', function() {
			let cf = new ConstantFunctions();
			assert.equal(cf.dist, undefined);
		});
		it('After set the distance the d also should be recalculated', function() {
			let cf = new ConstantFunctions();
			cf.distance = 5;
			assert.equal(cf.dist, 5);
			assert.equal(cf.d, 2.5);
		});
	});
	describe('testing Sigmoid function g', function() {
		it('After parameters the function should return the right value!', function() {
			let cf = new ConstantFunctions();
			cf.distance = 2;
			let localParam = 0;
			let assertedValue = 1 / (1 + Math.pow(e, (-cf.z * (localParam - cf.d) / cf.dist)));
			assert.equal(cf.g(localParam), assertedValue);
		});
	});
	describe('testing calculateDiffGradient, V, and payoff functions', function() {
		it('After calculateDiffGradient invoked, the G member should contain the proper values.', function() {
			let cf = new ConstantFunctions();
			let localDist = 4; // this setter invokes aslo calculateDiffGradient
			cf.distance = localDist;
			let assertedArray = new Array(localDist);
			assertedArray[0] = 1;
			for (var i = 1; i < localDist; ++i) {
				assertedArray[i] = 1 - ((cf.g(i) - cf.g(0)) / (cf.g(localDist) - cf.g(0)));
			}
			assert.deepEqual(cf.G, assertedArray);
		});
		it('Testing V function ...', function() {
			let cf = new ConstantFunctions();
			let local_i = 2;
			let localNeighborsCount = 5;
			let assertedValue = 1 / (1 + Math.pow(e, (-cf.steepness * (local_i - cf.inflexiosPontHelye)) / localNeighborsCount));
			assert.equal(cf.V(local_i, localNeighborsCount), assertedValue);
		});
		it('Testing payoff function ...', function() {
			let cf = new ConstantFunctions();
			let localCost = 0.141592;
			let localNeighborsCount = 5;
			let localCooperativeNeighboursCount = 2;
			
			let assertedValue = (cf.V(localCooperativeNeighboursCount, localNeighborsCount) - 
				cf.V(0, localNeighborsCount)) / (cf.V(localNeighborsCount, localNeighborsCount)
				- cf.V(0, localNeighborsCount)) - localCost;

			assert.equal(cf.payoff(localCooperativeNeighboursCount, localCost, localNeighborsCount), assertedValue );
		});
	});
	// describe('other functions');
});