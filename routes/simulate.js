/**
 * Handles the simulation without digaram page
 */
const router = require('express').Router();

router.get('/', function(req, res) {
	webSocketUri = req.get('host').split(':')[0];
	res.render('simulate', {
		active: 'simulate'
	});
});

module.exports = router;
