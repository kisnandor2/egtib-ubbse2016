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
var app = express();

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'pug');


app.use('/index', require('./routes/index'));
app.use('/', require('./routes/greet'));


app.listen(3001);
console.log("Server started");