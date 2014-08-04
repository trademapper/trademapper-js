
define(["d3", "spiralTree"], function(d3, spiralTree) {
	"use strict";
	var mapsvg, config, svgdefs, flowmap,
		arrowColours, minArrowWidth, maxArrowWidth, maxRouteWeight,

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
		setUpFlowmap();
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

	setUpFlowmap = function() {
		flowmap = new spiralTree.SpiralTree(mapsvg, function(xy) { return [xy[1], xy[0]]; });
		flowmap.extraSpiralClass = "traderoute";
		flowmap.setOpacity(1);
		flowmap.setNodeDrawable(false);
	},

	getArrowWidth = function(route) {
		var width = (route.weight / maxRouteWeight) * maxArrowWidth;
		return Math.max(width, minArrowWidth);
	},

	clearArrows = function() {
		d3.selectAll('.route-arrow').remove();
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

	drawRouteCollectionPlainArrows = function(collection) {
		clearArrows();
		maxRouteWeight = collection.maxWeight();
		var routeList = collection.getRoutes();
		for (var i = 0; i < routeList.length; i++) {
			if (routeList[i].points.length >= 2) {
				drawRoute(routeList[i]);
			}
		}
	},

	drawPoint = function(point, pointType) {
		var node, size, color;
		if (point.point === undefined) {
			console.log("point.point undefined for " + point.toString());
			return;
		}
		if (pointType == "source") {
			size = 5;
		} else if (pointType == "transit") {
			size = 4;
		} else if (pointType == "dest") {
			size = 3;
		} else {
			console.log("unknown pointType: " + pointType);
			return;
		}
		node = mapsvg.append("circle")
			.attr("cx", point.point[0])
			.attr("cy", point.point[1])
			.attr("r", size)
			.attr("class", "tradenode " + pointType);
	},

	drawPointRoles = function(pointRoles) {
		var pointInfo,
			pointKeys = Object.keys(pointRoles);

		for (var i = 0; i < pointKeys.length; i++) {
			pointInfo = pointRoles[pointKeys[i]];
			if (pointInfo.source) {
				drawPoint(pointInfo.point, "source");
			}
			if (pointInfo.transit) {
				drawPoint(pointInfo.point, "transit");
			}
			if (pointInfo.dest) {
				drawPoint(pointInfo.point, "dest");
			}
		}
	},

	clearPoints = function() {
		d3.selectAll(".tradenode").remove();
	},

	drawRouteCollectionSpiralTree = function(collection, pointRoles) {
		var ctAndMax = collection.getCenterTerminalList();
		var centerTerminals = ctAndMax.centerTerminalList;
		var maxSourceQuantity = ctAndMax.maxSourceQuantity;

		flowmap.clearSpiralPaths();
		clearPoints();
		//flowmap.setMaxQuantity(collection.maxWeight());
		flowmap.setMaxQuantity(maxSourceQuantity);

		for (var i = 0; i < centerTerminals.length; i++) {
			flowmap.preprocess(centerTerminals[i].terminals, centerTerminals[i].center);
			flowmap.drawTree();
		}

		drawPointRoles(pointRoles);
	};

	return {
		init: init,
		addDefsToSvg: addDefsToSvg,
		drawRoute: drawRoute,
		drawRouteCollectionSpiralTree: drawRouteCollectionSpiralTree,
		drawRouteCollectionPlainArrows: drawRouteCollectionPlainArrows
	};
});
