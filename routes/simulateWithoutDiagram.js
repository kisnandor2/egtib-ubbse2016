var router = require('express').Router();

router.get('/', function(req, res) {
	webSocketUri = req.get('host').split(':')[0];
	res.render('simulateWithoutDiagram', {
		active: 'simulateWithoutDiagram'
	});
});

module.exports = router;
