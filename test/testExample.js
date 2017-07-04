// const chai = require('chai');
// const assert = chai.assert;

// const SimulateVoronoi = require('../routes/simulatevoronoi');
// const logger = require('../routes/logger');
// logger.setLevel('OFF');

// describe('SimulateVoronoi', function() {


// 	describe('getNeighborsCount', function() {


// 		before(function() {
//         // Create a new instance of SimulateVoronoi module to be used in
//         voronoi = new SimulateVoronoi();
//    	});

// 		it('testing neighbours count',function(){
// 			sites = [ [215.72439, 62.73974, 'c',0.1],
//               [399.53053, 306.80018, 'c',  0.1],
//               [638.83229,79.52932, 'c', 0.1 ]];


// 			bbox = { xl: 0, xr: 961.15625, yt: 0, yb: 438.390625 };
// 			gen_count = 1
// 			coop_cost = 0.1
// 			dist = 1
// 			itShouldDivide = true
// 			constantParameters = undefined
// 			voronoi.init({sites,bbox,gen_count, dist, itShouldDivide, constantParameters })


// 			assert.equal(voronoi.getNeighborsCount(1), 2);
// 		})
// 	});


// 		describe('getCooperatingCount', function() {


// 			before(function() {
// 	        // Create a new instance of SimulateVoronoi module to be used in
// 	        voronoi = new SimulateVoronoi();
// 	   	});

// 			it('testing cooperating cells count',function(){
// 				sites = [['',215.72439, 62.73974, 'c',0.1],
// 	              ['',399.53053, 306.80018, 'c',  0.1],
// 	              ['',638.83229,79.52932, 'c', 0.1 ]];


// 				bbox = { xl: 0, xr: 961.15625, yt: 0, yb: 438.390625 };
// 				gen_count = 1
// 				coop_cost = 0.1
// 				dist = 1
// 				itShouldDivide = true
// 				constantParameters = undefined

// 				voronoi.init({sites,bbox,gen_count, dist, itShouldDivide, constantParameters })
// 				assert.equal(voronoi.getCooperatingCount(voronoi.sites), 3);
// 			})

// 			describe('areAllCellsDefecting', function() {


// 				before(function() {
// 		        // Create a new instance of SimulateVoronoi module to be used in
// 		        voronoi = new SimulateVoronoi();
// 		   	});

// 				it('tests if every site is defector ',function(){
// 					sites = [ [215.72439, 62.73974, 'd',0.1],
// 		              [399.53053, 306.80018, 'd',  0.1],
// 		              [638.83229,79.52932, 'd', 0.1 ]];


// 					bbox = { xl: 0, xr: 961.15625, yt: 0, yb: 438.390625 };
// 					gen_count = 1
// 					coop_cost = 0.1
// 					dist = 1
// 					itShouldDivide = true
// 					constantParameters = undefined
// 					voronoi.init({sites,bbox,gen_count, dist, itShouldDivide, constantParameters })
// 					assert.isTrue(voronoi.areAllCellsDefecting());
// 				})
// 			});

// });
// });
