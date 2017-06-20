/**
 * Handles the simulation with diagram page
 */
const router = require('express').Router();

router.get('/', function(req, res) {
	webSocketUri = req.get('host').split(':')[0];
	res.render('visualize', {
		active: 'visualize'
	});
});

module.exports = router;
