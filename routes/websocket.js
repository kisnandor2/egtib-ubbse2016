const logger = require('./logger');
const sessionParser = require('./sessionParser');

/**
 * Websocket constructor, express server must be passed
 * @constructor
 * @param {ExpressServer} server
 */
function Socket(server) {
	this.ws = new require('ws').Server({
		server: server
	});
	this.connections = [];
}

/**
 * Start the websocket to listen for incoming messages
 */
Socket.prototype.listen = function() {
	var server = this;
	this.ws.on('connection', function(socket) {
		logger.info('New socket opened');
		//Get session id for this socket
		sessionParser.cookieParser(socket.upgradeReq, null, function(error){
			if (error){
				logger.error('Error when trying to get session in websocket');
				logger.debug(error);
				return;
			}
			socket.sessionID = socket.upgradeReq.signedCookies['connect.sid']; //ITT AZTAN VEGKEPP PROBLEMA VAN
		})

		socket.on('message', function(msg) {
			data = JSON.parse(msg);

			if (data.heartbeat){
				logger.debug(`heartbeat ${socket.upgradeReq.connection.remoteAddress}`);
				return;
			}
			//Save the current socket into the queue
			server.connections.push(socket);
			//Get session variable
			sessionParser.store.get(socket.sessionID, function(err, session) {
				logger.warn(err);
				session.sites 		= data.sites;
				session.bbox 			= data.bbox;
				session.gen_count = data.gen_count;
				session.coop_cost = data.coop_cost;
				session.dist 			= data.dist;
				if (data.itShouldDivide == undefined){
					session.itShouldDivide = false;
					logger.debug('itShouldDivide parameter did not arrive. Set to false');
				}
				else{
					session.itShouldDivide = data.itShouldDivide;
				}
				if (data.steepness != undefined){
					session.constantParameters = {
						steepness: data.steepness,
						inflexiosPontHelye: data.inflexiosPontHelye,
						shapeOfDif: data.shapeOfDif,
						z: data.z,
					}
				}
				else{
					logger.debug('Visualization');
				}
				//Set that variable
				sessionParser.store.set(socket.sessionID, session, function(){
					socket.send('ready');
				});
			});
		});

		socket.on('close', function() {
			logger.info('Closing socket connection');
		});
	});
}

/**
 * Responds to the requests in order
 * @param {AnyData} data - data to be sent
 */
Socket.prototype.sendData = function(data) {
	let socket = this.connections.shift();
	if (socket == undefined){
		logger.error('No open connections');
	}
	socket.send(data);
}

module.exports = Socket;