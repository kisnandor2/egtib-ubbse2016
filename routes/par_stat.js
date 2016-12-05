/**
 * Created by rekaszilagyi on 2016-11-13.
 */
var router = require('express').Router();

router.get('/', function(req, res) {
  res.render('par_stat', {
    active: 'par_stat'
  });
});

module.exports = router;