module.exports = function() {
	this.get = (req,res,end) => {
		res.html("index");
		end();
	};
};