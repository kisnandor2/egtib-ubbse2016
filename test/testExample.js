const chai = require('chai');
const assert = chai.assert;

const SimulateVoronoi = require('../routes/simulatevoronoi.js');
SimulateVoronoi.logger.setLevel('OFF');

describe('SimulateVoronoi', function() {

  describe('compareSites', function() {
    it('should return true when the two parameters are the same', function() {
    	let voronoi = new SimulateVoronoi();
    	let site1 = {
    		x: 50,
    		y: 26.6
    	}
    	let site2 = {
    		x: 50,
    		y: 26.6
    	}
      assert.isTrue(voronoi.compareSites(site1, site2));
    });
    it('should return false when the two parameters are different', function(){
			let voronoi = new SimulateVoronoi();
    	let site1 = {
    		x: 5,
    		y: 266.6
    	}
    	let site2 = {
    		x: 500,
    		y: 266.6
    	}
    	assert.isFalse(voronoi.compareSites(site1, site2));
  	});
  });

  // describe('other functions');
});