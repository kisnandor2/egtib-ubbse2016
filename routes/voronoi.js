/**
 * Created by rekaszilagyi on 2016-11-13.
 */
var router = require('express').Router();

router.get('/', function(req, res){
    res.render('voronoi');
});

module.exports = router;