/**
 * Created by kisna on 2016-11-04.
 */
var router = require('express').Router();

router.get('/', function(req, res){
    res.render('greet');
});

module.exports = router;