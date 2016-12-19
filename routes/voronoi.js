	/**
 * Created by rekaszilagyi on 2016-11-13.
 */
const router = require('express').Router();
const logger = require('./logger');
const SimulateVoronoi = require('./simulatevoronoi');

var v;
var id = 0;

router.use(function(req, res, next) {
	//Always runs before any code
	if (!req.session.v) {
		v = req.session.v = new SimulateVoronoi(id++);
	}
	else {
		v = new SimulateVoronoi(id++);
		v.copy(req.session.v);
	}
	next(); //pass control to next handler
});

router.get('/', function(req, res) {
	res.render('voronoi', {
		sites: sites
	});
});

router.get('/data', function(req, res) {
	res.send(JSON.stringify(v.simulate()));
});

router.post('/init', function(req, res){
	if (v.init(req.body.sites)){
		res.status(200).json(0);
	} else {
		res.status(500).json(1);
	}
});

module.exports = router;
