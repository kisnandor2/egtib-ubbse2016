/*
 In this file you should put all the paths that should be managed by the server
 ex: app.use('path', require('./routes/controller'));

 Now create a controller.js in the routes folder like this:
 var router = require('express').Router();

 router.get('/', function(req, res){
		//..code
 });

 module.exports = router;

 Done
 */
let portno = process.env.PORT || 3001;

const express = require('express');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const requestLogger = require('express-logger');
const logger = require('./routes/logger');
let app = express();
const sesssionParser = require('./routes/sessionParser');

app.use(sesssionParser.sessionStorage);
app.use(sesssionParser.cookieParser);

app.use(requestLogger({ //Logs only the http requests
	path: "logs/reguestLog.log"
}));

app.use(express.static(__dirname + '/public'));
nunjucks.configure('views', {
	express: app
});

app.use(bodyParser.json());			// to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

app.engine('html', nunjucks.render);
app.set('view engine', 'html');

app.use('/index', require('./routes/index'));
app.use('/', require('./routes/greet'));
const voronoi = require('./routes/voronoi');
app.use('/voronoi', voronoi.router);
app.use('/parameter_statistics', require('./routes/par_stat'));
app.use(require('./routes/404'));

var server = app.listen(portno);
logger.info("Server listening on:", portno);

const webSocket = require('./routes/websocket');
const webSocketServer = new webSocket(server);
voronoi.setWebSocket(webSocketServer);

webSocketServer.listen();
logger.info('Websocket listening')
