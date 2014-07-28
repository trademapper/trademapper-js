
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
		for (var i = 0; i < route.points.length; i++) {
		}

		var routeline = d3.svg.line()
			.interpolate("monotone")
			.x(function(d) { return d.point[0]; })
			.y(function(d) { return d.point[1]; });

		mapsvg.append("path")
			.datum(route.points)
			.attr("class", "route-arrow")
			.attr("d", routeline);
	};

	return {
		init: init,
		drawRoute: drawRoute
	};
});

