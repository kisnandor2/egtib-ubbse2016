const session = require('express-session');
const secret = 'secretEGTIB';
var store = undefined;

//Check if production environment
if (process.env.MONGODB_URI){
	const MongoStore = require('connect-mongo')(session);
	store = new MongoStore({
		db : 'session',
		url: process.env.MONGODB_URI
	});
}
else {
	store = new session.MemoryStore();
}

//Set the storage
sessionStorage = session({
	secret: secret,
	store: store,
	resave: false,
	saveUninitialized: true,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 // 1 day
	}
});

//Set the cookieParser with the secret key
const cookieParser = require('cookie-parser')(secret);

module.exports = {
	sessionStorage: sessionStorage,
	cookieParser: cookieParser,
	store: store
}