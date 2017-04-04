/**
 * Handles the index route
 */
const router = require('express').Router();

router.get('/', function(req, res) {
    res.render('index', {
    	active: 'index' 
    });
});

module.exports = router;
