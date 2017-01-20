var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

module.exports = handler;

var _handlers = [];

function handler(options) {
	var options = options || {};
	this.portNumber = options.portNumber || -1;
	this.defaultHandler = options.defaultHandler || "index";
	this.defaultAction = options.defaultAction || "get";
	
	this.responseTimeout = options.responseTimeout || 0;
	this.responseTimeoutCallback = options.responseTimeoutCallback || null;
	this.pathToHandlers = options.pathToHandlers || "./handlers";
	
	this.app = express();
	this.initialized=false;
	
	this.app.use(bodyParser.json()); 
	this.app.use(bodyParser.urlencoded({ extended: true }));
};

handler.prototype = {
	use : function(fnc) {
		this.app.use(fnc);
	},
	start : function() {
		var t = this;
		this.app.use(this.handle());
		this.app.listen(this.portNumber, function(err) {
			if (err) {
				console.log(err);
			} else {
				console.log("app listening on port : " + t.portNumber);
				t.initialized = true;
			}
		});
	},
	handle : function() {
		var t = this;
		return function (req, res, next) {

			if (res.finished)
				return;

			var routes = req.path.substring(1).split("/"),
				action = routes.length > 1 ? routes.pop() : t.defaultAction,
				action = action != "" ? action : t.defaultAction,
				route = routes.length > 1 ? routes.join("_") : routes[0] !== "" ? routes[0] : t.defaultHandler,
				lookupHandler = routes.length > 1 ? routes.join("/") : route;
		
			if (typeof _handlers[route] === "undefined") {
				if (fs.existsSync(t.pathToHandlers + "/" + lookupHandler + ".js")) {
					try {
						_handlers[route] = new (require(t.pathToHandlers + "/" + lookupHandler));
					} catch (e) {
						console.warn(e);
					}
				}
			}

			if (typeof _handlers[route] !== "undefined") {
				if (typeof _handlers[route][action] !== "undefined") {
					var hres = new handler_response(res);
					_handlers[route][action].call(_handlers[route], req, hres, function() {
						hres.render();
					});
					if (t.responseTimeout > 0 && t.responseTimeoutCallback != null) {
						setTimeout(function () {
							if (res.finished) {
								return;
							}
							t.responseTimeoutCallback(req, res);
						}, t.responseTimeout);
					}
				} else {
					res.end("action not found");
				}
			} else {
				res.end("handler Not Found");
			}
		};
	}
};

function handler_response(res) {
	this._json = [];
	this._html = [];
	this._res = res;
}
handler_response.prototype = {
	json : function(object) {
		this._json.push(object);
	},
	html : function(str) {
		this._html.push(str);
	},
	render : function() {
		if (this._json.length > 0) {
			this._res.json(this._json);
		} else {
			this._res.send(this._html.join(""));
		}
	}
};