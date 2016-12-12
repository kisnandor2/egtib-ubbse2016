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
let portno = 80; // use this for entering a different port number

const express = require('express');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const requestLogger = require('express-logger');
const logger = require('./routes/logger');
let app = express();
const session = require('express-session')


if (process.env.NODE && ~process.env.NODE.indexOf("heroku")){ //check if running in Heroku
	const MongoStore = require('connect-mongo')(session);
	app.use(session({
			secret: 'secretEGTIB',
			store: new MongoStore({ //TODO: this has to be set correctly
				host: '127.0.0.1',
				port: '27017',
				db : 'session',
				url: 'mongodb://localhost:27017/demo'
			}),
			resave: false,
			saveUninitialized: true,
			cookie: {
				maxAge: 1000 * 60 *60 * 24 //1day
			}
	}));
}
else { //develpoment, don't use Database for session
	const session = require('express-session');
	app.use(session({
		secret: 'secretEGTIB',
		resave: false,
		saveUninitialized: true,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 // 1 day
		}
	}));
}

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
app.use('/voronoi', require('./routes/voronoi'));
app.use('/parameter_statistics', require('./routes/par_stat'));
app.use(require('./routes/404'));

app.listen(portno);
logger.info("Server listening on:", portno);