
define(["d3"], function(d3) {
	var mapsvg, config,

	/*
	 * Save the svg we use for later user
	 */
	init = function(svgElement) {
		mapsvg = svgElement;
	},

	/*
	 * Draw a route - the route argument is basically a list of point
	 */
	drawRoute = function(route) {
	};

	return {
		init: init,
		drawRoute: drawRoute
	};
});

