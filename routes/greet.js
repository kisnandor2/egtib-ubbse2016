/**
 * Handles the greet screen
 */
const router = require('express').Router();

router.get('/', function(req, res){
	res.render('greet');
});

module.exports = router;