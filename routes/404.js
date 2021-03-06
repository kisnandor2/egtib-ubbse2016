/**
 * Returns the 404 error handling route
 */
module.exports = function(req, res, next){
	res.status(404);

	// respond with html page
	if (req.accepts('html')) {
		res.render('404');
		return;
	}

	// respond with json
	if (req.accepts('json')) {
		res.send({ error: 'Not found' });
		return;
	}

	// default
	res.type('txt').send('Not found');
}