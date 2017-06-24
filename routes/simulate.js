/**
 * Handles the simulation without digaram page
 */
const router = require('express').Router();

router.get('/simple', function(req, res) {
	webSocketUri = req.get('host').split(':')[0];
	res.render('simulateSimple', {
		active: 'simulateSimple'
	});
});

router.get('/two', function(req, res) {
    webSocketUri = req.get('host').split(':')[0];
    res.render('simulateTwo', {
        active: 'simulateTwo'
    });
});

module.exports = router;
