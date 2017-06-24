/**
 * Handles the simulation with diagram page
 */
const router = require('express').Router();

router.get('/simple', function(req, res) {
	webSocketUri = req.get('host').split(':')[0];
	res.render('visualizeSimple', {
		active: 'visualizeSimple'
	});
});

router.get('/two', function(req, res) {
    webSocketUri = req.get('host').split(':')[0];
    res.render('visualizeTwo', {
        active: 'visualizeTwo'
    });
});
module.exports = router;
