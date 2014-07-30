
define(["d3"], function(d3) {
	"use strict";
	return {
		// these are intended to be set at init time
		mapsvg: null,
		arrowColours: null,
		minArrowWidth: null,
		maxArrowWidth: null,

		// these are intended to be set as required
		maxRouteWeight: null,

		// these are managed internally
		svgdefs: null,

		/*
		 * Save the svg we use for later user
		 * Add the arrow head to defs/marker in the SVG
		 */
		init: function() {
			this.addDefsToSvg();
		},

		addDefsToSvg: function() {
			this.svgdefs = this.mapsvg.append("defs");
			// first add arrow head
			this.svgdefs.append("marker")
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

			// now add a gradient
			var gradient = this.svgdefs.append("linearGradient")
				.attr("id", "route-grad");
			gradient.append("stop")
				.attr("offset", "0%")
				.attr("stop-color", this.arrowColours.pathStart)
				.attr("stop-opacity", "0.5");
			gradient.append("stop")
				.attr("offset", "100%")
				.attr("stop-color", this.arrowColours.pathEnd)
				.attr("stop-opacity", "0.5");
		},

		setMaxRouteWeight: function(maxWeight) {
			this.maxRouteWeight = maxWeight;
		},

		getArrowWidth: function(route) {
			var width = (route.weight / this.maxWeight) * this.maxArrowWidth;
			return Math.max(width, this.minArrowWidth);
		},

		/*
		 * Draw a route - the route argument is basically a list of point
		 */
		drawRoute: function(route) {
			var routeline = d3.svg.line()
				.interpolate("monotone")
				.x(function(d) { return d.point[0]; })
				.y(function(d) { return d.point[1]; });

			this.mapsvg
				.append("path")
					.datum(route.points)
					.attr("class", "route-arrow")
					.attr("d", routeline)
					.attr("marker-end", "url(#markerArrow)")
					.attr("stroke", "url(#route-grad)")
					.attr("stroke-width", 2);
		},

		drawRouteCollection: function(collection) {
			var routeList = collection.getRoutes();
			for (var i = 0; i < routeList.length; i++) {
				if (routeList[i].points.length >= 2) {
					this.drawRoute(routeList[i]);
				}
			}
		}
	};
});
