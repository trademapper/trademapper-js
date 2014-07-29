
define(["d3"], function(d3) {
	var mapsvg, config,

	/*
	 * Save the svg we use for later user
	 * Add the arrow head to defs/marker in the SVG
	 */
	init = function(svgElement) {
		mapsvg = svgElement;
		addArrowHeadToSvg();
	},

	addArrowHeadToSvg = function() {
		mapsvg
			.append("defs")
			.append("marker")
				.attr("id", "markerArrow")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "strokeWidth")
				.attr("refX", "10")
				.attr("refY", "5")
				.attr("markerWidth", "4")
				.attr("markerHeight", "3")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 0 0 L 10 5 L 0 10 z")
				.attr("class", "route-arrow-head");

	},

	/*
	 * Draw a route - the route argument is basically a list of point
	 */
	drawRoute = function(route) {
		var routeline = d3.svg.line()
			.interpolate("monotone")
			.x(function(d) { return d.point[0]; })
			.y(function(d) { return d.point[1]; });

		mapsvg
			.append("path")
				.datum(route.points)
				.attr("class", "route-arrow")
				.attr("d", routeline)
				.attr("marker-end", "url(#markerArrow)");
	},

	drawRouteCollection = function(collection) {
		routeList = collection.getRoutes();
		for (var i = 0; i < routeList.length; i++) {
			drawRoute(collection.routes[routeCode]);
		}
	};

	return {
		init: init,
		addArrowHeadToSvg: addArrowHeadToSvg,
		drawRoute: drawRoute,
		drawRouteCollection: drawRouteCollection
	};
});
