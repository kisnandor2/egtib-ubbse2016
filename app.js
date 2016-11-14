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

var express = require('express');
var nunjucks = require('nunjucks');
var app = express();

app.use(express.static(__dirname + '/public'));
nunjucks.configure('views', {
	autoescape: true,
	express: app
})
app.engine('html', nunjucks.render);
app.set('view engine', 'html');


app.use('/index', require('./routes/index'));
app.use('/', require('./routes/greet'));
app.use('/voronoi', require('./routes/voronoi'));
app.use(require('./routes/404'));


app.listen(3001);
console.log("Server started");