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

router.get('/data', function(req, res) {
	v.init(req.session);	//ES6 parameter destructuring
	try {
		let data = v.simulate();
		v.saveSimulationData(data);
		server.sendData(JSON.stringify(data));
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
    two.init(req.session);	//ES6 parameter destructuring
    try {
    		let data = two.simulate();
				two.saveSimulationData(data);
        server.sendData(JSON.stringify(data));
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
