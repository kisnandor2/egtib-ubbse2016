const logger = require('./logger');
const sessionParser = require('./sessionParser');

function Socket(server) {
	this.ws = new require('ws').Server({
		server: server
	});
}

Socket.prototype.listen = function() {
	let server = this;

	this.ws.on('connection', function(socket) {
		logger.info('New socket opened');
		server.socket = socket;
		//Get session id for this socket
		sessionParser.cookieParser(socket.upgradeReq, null, function(error){
			if (error){
				logger.error('Error when trying to get session in websocket');
				logger.debug(error);
				return;
			}
			socket.sessionID = socket.upgradeReq.signedCookies['connect.sid'];
		})

		socket.on('message', function(msg) {
			data = JSON.parse(msg);
			if (data.heartbeat){
				logger.debug(data.heartbeat);
				return;
			}
			//Get session variable
			sessionParser.store.get(socket.sessionID, function(err, session) {
				session.sites 		= data.sites;
				session.bbox 			= data.bbox;
				session.gen_count = data.gen_count;
				session.coop_cost = data.coop_cost;
				session.dist 			= data.dist;
				logger.debug("Websocket coop cost recieved: ", data.coop_cost);
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

Socket.prototype.sendData = function(data) {
	if (this.socket == null) {
		logger.error('Client socket is closed');
		return;
	}
	this.socket.send(data);
}

module.exports = Socket;