
define(["d3"], function(d3) {
	"use strict";
	var mapsvg, config, svgdefs, arrowColours, minArrowWidth, maxArrowWidth, maxRouteWeight,

	/*
	 * Save the svg we use for later user
	 * Add the arrow head to defs/marker in the SVG
	 */
	init = function(svgElement, colours, minWidth, maxWidth) {
		mapsvg = svgElement;
		arrowColours = colours;
		minArrowWidth = minWidth;
		maxArrowWidth = maxWidth;
		addDefsToSvg();
	},

	addDefsToSvg = function() {
		svgdefs = mapsvg.append("defs");
		// first add arrow head
		svgdefs.append("marker")
				.attr("id", "markerArrow")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "strokeWidth")
				.attr("refX", "7")
				.attr("refY", "5")
				.attr("markerWidth", "4")
				.attr("markerHeight", "3")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 0 0 L 10 5 L 0 10 z")
				.attr("class", "route-arrow-head");

		// now add a gradient
		var gradient = svgdefs.append("linearGradient")
			.attr("id", "route-grad");
		gradient.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", arrowColours.pathStart)
			.attr("stop-opacity", "0.5");
		gradient.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", arrowColours.pathEnd)
			.attr("stop-opacity", "0.5");
	},

	getArrowWidth = function(route) {
		var width = (route.weight / maxRouteWeight) * maxArrowWidth;
		return Math.max(width, minArrowWidth);
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
				.attr("marker-end", "url(#markerArrow)")
				.attr("stroke", "url(#route-grad)")
				.attr("stroke-width", getArrowWidth(route));
	},

	drawRouteCollection = function(collection) {
		maxRouteWeight = collection.maxWeight();
		var routeList = collection.getRoutes();
		for (var i = 0; i < routeList.length; i++) {
			if (routeList[i].points.length >= 2) {
				drawRoute(routeList[i]);
			}
		}
	},

	clearArrows = function() {
		d3.selectAll('.route-arrow').remove();
	};

	return {
		init: init,
		addDefsToSvg: addDefsToSvg,
		drawRoute: drawRoute,
		drawRouteCollection: drawRouteCollection
	};
});
