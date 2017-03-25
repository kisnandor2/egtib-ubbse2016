/**
 * Created by rekaszilagyi on 2016-11-13.
 */
const router = require('express').Router();
const logger = require('./logger');
const SimulateVoronoi = require('./simulatevoronoi');

var server = undefined;

var setWebSocket = function(webSocketServer){
	server = webSocketServer;
}

router.get('/data', function(req, res) {
	let v = new SimulateVoronoi();
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
