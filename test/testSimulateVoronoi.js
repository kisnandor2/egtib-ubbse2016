const chai = require('chai');
const assert = chai.assert;

const SimulateVoronoi = require('../routes/simulatevoronoi');
const Cell = require('../routes/Cell.js');
const logger = require('../routes/logger');
// logger.setLevel('OFF');

describe('SimulateVoronoi', function() {
        bbox = { xl: 0, xr: 961.15625, yt: 0, yb: 438.390625 };
        gen_count = 1
        coop_cost = 0.1
        dist = 1
        itShouldDivide = true
        constantParameters = undefined
    before(function(){
        voronoi = new SimulateVoronoi();
    });
	describe('reCalculateSites - it should delete the duplicated cells', function() {
		it('Each cell is individual from 4', function() {
            sites = [ ['x', 215.72439, 62.73974, 'c',0.1],
                        ['x', 399.53053, 306.80018, 'c',  0.1],
                        ['x', 638.83229,79.52932, 'c', 0.1 ],
                        ['x', 889.57708, 312.28484, 'c', 0.1]];
            iniObj = {sites, bbox, gen_count, coop_cost, dist, itShouldDivide, constantParameters};

            voronoi.init(iniObj);
            voronoi.reCalculateSites();
			assert.equal(voronoi.sites.length, 4, "Deleted non duplicate object");
		});
        it('We have one duplicate', function() {
            sites = [ ['x', 215.72439, 62.73974, 'c',0.1],
                        ['x', 399.53053, 306.80018, 'c',  0.1],
                        ['x', 399.53053, 306.80018, 'c', 0.1 ],
                        ['x', 889.57708, 312.28484, 'c', 0.1]];
            iniObj = {sites, bbox, gen_count, coop_cost, dist, itShouldDivide, constantParameters};

            voronoi.init(iniObj);
            voronoi.reCalculateSites();
			assert.equal(voronoi.sites.length, 3, "Remove not succeded");
		});
	});
    describe('setPayoffs', function() {
		it('each payOff of point\'s should be between 0 and 1', function() {
            sites = [ ['x', 215.72439, 62.73974, 'c',0.1],
                        ['x', 399.53053, 306.80018, 'c',  0.1],
                        ['x', 638.83229,79.52932, 'c', 0.1 ],
                        ['x', 889.57708, 312.28484, 'c', 0.1]];
            iniObj = {sites, bbox, gen_count, coop_cost, dist, itShouldDivide, constantParameters};

            voronoi.init(iniObj);
            voronoi.setPayoffs();
            for (var i = 0; i < voronoi.sites.length; ++i) {
                let actualPoint = voronoi.sites[i];
		        assert.isAtMost(actualPoint.payoff, 1);
                assert.isAtLeast(actualPoint.payoff,0);
	        }
		});
	});
});