/**
 * Handles the simulation with diagram page
 */
const router = require('express').Router();

router.get('/simple', function(req, res) {
	res.render('visualizeSimple', {
		active: 'visualize'
	});
});

router.get('/two', function(req, res) {
    res.render('visualizeTwo', {
        active: 'visualize'
    });
});
module.exports = router;
