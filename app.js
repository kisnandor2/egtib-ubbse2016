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

let portno = 3001; // use this for entering a different port number

const express = require('express');
const nunjucks = require('nunjucks');
const session = require('express-session');
const bodyParser = require('body-parser')
let app = express();

app.use(session({
	secret: 'secretEGTIB',
	resave: false,
	saveUninitialized: true,
	cookie: {
		expires: false,
	}
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
console.log("Server started, listening on: "+ portno);