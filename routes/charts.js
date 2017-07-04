/**
 * Handles the results tab, sending back to the client the results of a huge simulation
 */
const router = require('express').Router();
const logger = require('./logger');

const MongoClient = require('mongodb').MongoClient;
var MongoURI = null;
if (process.env.MONGODB_URI){
	MongoURI = process.env.MONGODB_URI;
}
else{
	MongoURI = "mongodb://localhost:27017";
}
MongoURI += "/egtib";

router.get('/simple', function(req, res) {
	res.render('chartsSimple', {
		active: 'charts'
	});
});


router.get('/two', function(req, res) {
    res.render('chartsTwo', {
        active: 'charts'
    });
});
router.get('/dataWarburg', (req, res)=>{
	let percentOfDefectingCells = 0;
	let cooperatingCost = 0;
	let distanceOfInteraction = 0;
	let cooperatingLimit = 0;
	let error = 0.05;
	try {
		percentOfDefectingCells = parseFloat(req.query.percentOfDefectingCells)/100;
		cooperatingCost = parseFloat(req.query.cooperatingCost);
		distanceOfInteraction = parseInt(req.query.distanceOfInteraction);
		cooperatingLimit = parseFloat(req.query.cooperatingLimit);
	}
	catch (err) {
		logger.error(err);
		return
	}
	MongoClient.connect(MongoURI, function(err, db) {
		if(err) {
			logger.error(err); 
			return;
		}
		let query = {
			'cooperatingCost': cooperatingCost,
			'percentageDef': {'$gt': -error + percentOfDefectingCells, '$lt': error + percentOfDefectingCells},
			'dist': distanceOfInteraction,
			'warburg': true,
			'cooperatingLimit': cooperatingLimit,
		}
		db.collection("egtib").find(query).toArray((err, items)=>{
			if (err){
				logger.error(err);
				res.send('Could not connect to EGTIB collection');
				return;
			}
			if (items.length <= 0){
				logger.trace('No items found in the DB');
				res.status(201).send("No items found in the database");
				return;
			}
			db.close();
			let result = dbDataToReadableClientData(items)
			res.send(result);
			logger.debug('Data from DB OK. Results sent!');
		});
	});
})

router.get('/data', function(req, res){
	let percentOfDefectingCells = 0;
	let cooperatingCost = 0;
	let distanceOfInteraction = 0;
	let error = 0.5;
	try {
		percentOfDefectingCells = parseFloat(req.query.percentOfDefectingCells)/100;
		cooperatingCost = parseFloat(req.query.cooperatingCost);
		distanceOfInteraction = parseInt(req.query.distanceOfInteraction);
	}
	catch (err) {
		logger.error(err);
		return
	}
	MongoClient.connect(MongoURI, function(err, db) {
		if(err) {
			logger.error(err); 
			return;
		}
		let query = {
			'cooperatingCost': cooperatingCost,
			'percentageDef': {'$gt': -error + percentOfDefectingCells, '$lt': error + percentOfDefectingCells},
			'dist': distanceOfInteraction,
			'warburg': false
		}
		db.collection("egtib").find(query).toArray((err, items)=>{
			if (err){
				logger.error(err);
				res.send('error');
				return;
			}
			if (items.length <= 0){
				logger.trace('No items found in the DB');
				res.status(201).send("No items found in the database");
				return;
			}
			db.close();
			let result = dbDataToReadableClientData(items)
			res.send(result);
			logger.debug('Data from DB OK. Results sent!');
		});
	});
})

function dbDataToReadableClientData(dataJSON){
	let ret = [];
	for (let i = 0; i < dataJSON.length; ++i){
		let current = dataJSON[i];
		let dist = current.dist;
		if (ret[dist] == undefined){
			ret[dist] = [];
		}
		for (let j = 0; j < current.results.length; ++j){
			if (ret[dist][j] == undefined){
				ret[dist].push({
					mean: 0,
					max: -1,
					min: 2,
					count: 0
				})
			}
			let result = current.results[j];
			let cellCount = result.cooperating + result.defecting;
			let currentMean = (result.cooperating/cellCount);
			ret[dist][j].mean += currentMean;
			if (ret[dist][j].max < currentMean){
				ret[dist][j].max = currentMean;
			}
			if (ret[dist][j].min > currentMean){
				ret[dist][j].min = currentMean;
			}
			ret[dist][j].count++;
		}
	}
	for (let i in ret){
		for (let j = 0; j < ret[i].length; ++j){
			ret[i][j].mean /= ret[i][j].count;
		}
	}
	ret.shift();
	return JSON.stringify(ret);
}

module.exports = router;
