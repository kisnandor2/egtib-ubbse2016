/**
 * Handles the voronoi route get and post requests.
 * Intermediate interface between the UI and Simulation
 */
const router = require('express').Router();
const logger = require('./logger');
const SimulateVoronoi = require('./simulatevoronoi');

var server = undefined;
var v = new SimulateVoronoi();

var setWebSocket = function(webSocketServer){
	server = webSocketServer;
}

function test(i, data){
	if (i > 100)
		return;
	v.init(JSON.parse(data));
	let ret = v.simulate();
	v.saveSimulationData(ret, test, i+1, data);
}

router.get('/data', function(req, res) {
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

router.get('/reset', function(req, res){
	SimulateVoronoi.myRandomGenerator.resetSeed();
	res.status(200).send('ok');
})

module.exports = {
	router: router,
	setWebSocket: setWebSocket
}
