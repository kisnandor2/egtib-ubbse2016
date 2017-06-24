/**
 * Handles the simulation without digaram page
 */
const router = require('express').Router();

router.get('/simple', function(req, res) {
	res.render('simulateSimple', {
		active: 'simulate'
	});
});

router.get('/two', function(req, res) {
    res.render('simulateTwo', {
        active: 'simulate'
    });
});

module.exports = router;
