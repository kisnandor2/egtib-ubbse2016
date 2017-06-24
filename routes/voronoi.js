/**
 * Handles the voronoi route get and post requests.
 * Intermediate interface between the UI and Simulation
 */
const router = require('express').Router();
const logger = require('./logger');
const SimulateVoronoi = require('./simulatevoronoi');
const SimulateVoronoiTwoBjs = require('./SimulateVoronoiTwoBjs');
const eventEmitter = require('./EventEmitter');

var server = undefined;
var v = new SimulateVoronoi();
var two = new SimulateVoronoiTwoBjs();

var setWebSocket = function(webSocketServer){
	server = webSocketServer;
}

function test(i, data){
	if (i > 100){
		return;
	}
	v.init(JSON.parse(data));
	let ret = v.simulate();
	v.saveSimulationData('simulation.json', ret, test, i+1, data);
}

router.get('/data', function(req, res) {
	// test(0, JSON.stringify(req.session));
	two.init(req.session);	//ES6 parameter destructuring
	try {
		server.sendData(JSON.stringify(two.simulate()));
		res.status(200).send('ok');
	}
	catch (error) {
		logger.error(error);
		server.sendData(JSON.stringify("error"));
		res.status(200).send('error');
	}
});

router.get('/warburg', function(req, res) {
    // test(0, JSON.stringify(req.session));
    v.init(req.session);	//ES6 parameter destructuring
    try {
        server.sendData(JSON.stringify(v.simulate()));
        res.status(200).send('ok');
    }
    catch (error) {
        logger.error(error);
        server.sendData(JSON.stringify("error"));
        res.status(200).send('error');
    }
});
module.exports = {
	router: router,
	setWebSocket: setWebSocket
}
