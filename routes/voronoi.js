/**
 * Created by rekaszilagyi on 2016-11-13.
 */
const router = require('express').Router();
const logger = require('./logger');
const SimulateVoronoi = require('./simulatevoronoi');

var v;
var id = 0;

var server = undefined;

var setWebSocket = function(webSocketServer){
	server = webSocketServer;
}

router.use(function(req, res, next) {
	//Always runs before any code
	if (!req.session.v) {
		v = req.session.v = new SimulateVoronoi(id++);
		logger.debug('new voronoi created');
	} else {
		v = new SimulateVoronoi(id++);
		v.copy(req.session.v);
		req.session.v = v;
	}
	next(); //pass control to next handler
});

router.get('/data', function(req, res) {
	logger.info('Init voronoi from the client data');
	v.init(req.session.sites);
	server.sendData(JSON.stringify(v.simulate()));
});

module.exports = {
	router: router,
	set: setWebSocket
}
