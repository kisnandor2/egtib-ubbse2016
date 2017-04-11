/**
 * Handles the results tab, sending back to the client the results of a huge simulation
 */
const router = require('express').Router();
const fs = require('fs');
const logger = require('./logger');

router.get('/', function(req, res) {
	res.render('charts', {
		active: 'charts'
	});
});

router.get('/data', function(req, res){
	fs.readFile('simulation.json', 'utf8', (err, data) => {
		if (err){
			logger.error(err);
			return;
		}
		let dataJSON = JSON.parse(data);
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
		res.send(JSON.stringify(ret));
	})
})

module.exports = router;
