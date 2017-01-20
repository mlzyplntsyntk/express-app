var expressApp = require('../app');

var app = new expressApp({
	portNumber : 1920,
	// path should be absolute
	pathToHandlers : "./test",
	responseTimeout : 1000,
	defaultHandler : "index",
	defaultAction : "get",
	responseTimeoutCallback : function(req,res) {
		res.send("timeout occured");
	}
});
app.start();