
define(["d3", "spiralTree"], function(d3, spiralTree) {
	"use strict";
	return {
	mapsvg: null,
	tooltip: null,
	config: null,
	svgdefs: null,
	flowmap: null,
	arrowColours: null,
	minArrowWidth: null,
	maxArrowWidth: null,
	maxRouteQuantity: null,
	centerTerminals: null,
	maxSourceQuantity: null,

	/*
	 * Save the svg we use for later user
	 * Add the arrow head to defs/marker in the SVG
	 */
	init: function(svgElement, tooltipElement, colours, minWidth, maxWidth) {
		this.mapsvg = svgElement;
		this.tooltip = tooltipElement;
		this.arrowColours = colours;
		this.minArrowWidth = minWidth;
		this.maxArrowWidth = maxWidth;
		this.addDefsToSvg();
		this.setUpFlowmap();
		this.tooltip.style("opacity", 0);
	},

	addDefsToSvg: function() {
		this.svgdefs = this.mapsvg.select("defs");
		// first add arrow head
		this.svgdefs.append("marker")
				.attr("id", "markerArrowWide")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "strokeWidth")
				//.attr("markerUnits", "userSpaceOnUse")
				.attr("refX", "7")
				.attr("refY", "5")
				.attr("markerWidth", "1")
				.attr("markerHeight", "1.3")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 9 2 L 3 5 L 9 8 z")
				.attr("class", "route-arrow-head-wide");

		this.svgdefs.append("marker")
				.attr("id", "markerArrowNarrow")
				.attr("viewBox", "0 0 10 10")
				//.attr("markerUnits", "strokeWidth")
				.attr("markerUnits", "userSpaceOnUse")
				.attr("refX", "7")
				.attr("refY", "5")
				.attr("markerWidth", "6")
				.attr("markerHeight", "8")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 10 0 L 0 5 L 10 10 z")
				.attr("class", "route-arrow-head-narrow");

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

	setUpFlowmap: function() {
		this.flowmap = new spiralTree.SpiralTree(this.mapsvg, function(xy) { return [xy[1], xy[0]]; });
		this.flowmap.extraSpiralClass = "traderoute";
		this.flowmap.setOpacity(0.5);
		this.flowmap.setNodeDrawable(false);
		this.flowmap.markerStart.wide = "url(#markerArrowWide)";
		this.flowmap.markerStart.narrow = "url(#markerArrowNarrow)";
	},

	getArrowWidth: function(route) {
		var width = (route.quantity / this.maxRouteQuantity) * this.maxArrowWidth;
		return Math.max(width, this.minArrowWidth);
	},

	clearArrows: function() {
		d3.selectAll('.route-arrow').remove();
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
				.attr("stroke-width", this.getArrowWidth(route));
	},

	drawRouteCollectionPlainArrows: function(collection) {
		this.clearArrows();
		this.maxRouteQuantity = collection.maxQuantity();
		var routeList = collection.getRoutes();
		for (var i = 0; i < routeList.length; i++) {
			if (routeList[i].points.length >= 2) {
				this.drawRoute(routeList[i]);
			}
		}
	},

	drawPoint: function(x, y, pointType, extraclass) {
		var size, htmlClass;
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
		if (extraclass) {
			htmlClass = "tradenode " + pointType + " " + extraclass;
		} else {
			htmlClass = "tradenode " + pointType;
		}

		this.mapsvg.append("circle")
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", size)
			.attr("class", htmlClass);
	},

	drawPointRole: function(point, pointType) {
		if (point.point === undefined) {
			console.log("point.point undefined for " + point.toString());
			return;
		}
		this.drawPoint(point.point[0], point.point[1], pointType);
	},

	drawPointRoles: function(pointRoles) {
		var pointInfo,
			pointKeys = Object.keys(pointRoles);

		for (var i = 0; i < pointKeys.length; i++) {
			pointInfo = pointRoles[pointKeys[i]];
			if (pointInfo.source) {
				this.drawPointRole(pointInfo.point, "source");
			}
			if (pointInfo.transit) {
				this.drawPointRole(pointInfo.point, "transit");
			}
			if (pointInfo.dest) {
				this.drawPointRole(pointInfo.point, "dest");
			}
		}
	},

	clearPoints: function() {
		d3.selectAll(".tradenode").remove();
	},

	genericMouseOverPath: function(ctIndex) {
		var center = this.centerTerminals[ctIndex].center;
		var terminals = this.centerTerminals[ctIndex].terminals;
		// sort, largest quantity first (hence the order swap)
		terminals.sort(function(a, b) { return b.quantity - a.quantity; });

		// first make the paths stand out, and clear any old paths
		d3.selectAll(".traderoute-highlight").classed("traderoute-highlight", false);
		var allpath = d3.selectAll(".traderoute.center-" + center.point.toString());
		allpath.classed("traderoute-highlight", true);

		// now do the tooltip
		var tooltiptext = '<span class="tooltip-source">Source: ' +
			center.point.toString() + '</span>';

		for (var i = 0; i < terminals.length; i++) {
			// TODO: order by quantity
			tooltiptext += '<br /><span class="tooltip-dest">to: <em>' +
				terminals[i].point.toString() + '</em> : ' + '<em>' +
				terminals[i].quantity.toFixed(1) + '</em></span>';
		}

		this.tooltip.html(tooltiptext);

		var box = d3.select("#mapcanvas")[0][0].getBoundingClientRect();
		this.tooltip
			.style("width", "17em")
			.style("height", 1.5*(1 + terminals.length) + "em")
			.style("left", (d3.event.pageX - box.left + 10) + "px")
			.style("top", (d3.event.pageY - box.top - 100) + "px");

		this.tooltip.transition()
			.duration(200)
			.style("opacity", 0.9);
	},

	genericMouseOutPath: function() {
		return;
		// TODO: decide what behaviour we want on mouseOut
		d3.selectAll(".traderoute-highlight").classed("traderoute-highlight", false);
		this.tooltip.transition()
			.duration(500)
			.style("opacity", 0);
	},

	clearTooltip: function() {
		this.tooltip.transition()
			.duration(200)
			.style("opacity", 0);
	},

	createMouseOverFunc: function(ctIndex) {
		var moduleThis = this;
		return function() { moduleThis.genericMouseOverPath(ctIndex); };
	},

	drawRouteCollectionSpiralTree: function(collection, pointRoles) {
		var center, terminals;
		var ctAndMax = collection.getCenterTerminalList();
		this.centerTerminals = ctAndMax.centerTerminalList;
		this.maxSourceQuantity = ctAndMax.maxSourceQuantity;

		this.flowmap.clearSpiralPaths();
		this.clearPoints();
		this.flowmap.setMaxQuantity(this.maxSourceQuantity);

		for (var i = 0; i < this.centerTerminals.length; i++) {
			center = this.centerTerminals[i].center;
			terminals = this.centerTerminals[i].terminals;
			// set up flowmap settings for this path
			this.flowmap.extraSpiralClass = "traderoute center-" + center.point.toString();
			this.flowmap.mouseOverFunc = this.createMouseOverFunc(i);
			this.flowmap.mouseOutFunc = this.genericMouseOutPath;

			// now do preprocess and drawing
			this.flowmap.preprocess(terminals, center);
			this.flowmap.drawTree();
		}

		this.drawPointRoles(pointRoles);
	},
	
	drawLegend: function() {
		// use parseFloat as the height has "px" at the end
		var i, strokeWidth, value, valueText, circleX, circleY,
			margin = 10,
			lineLength = this.maxArrowWidth + 10,
			svgHeight = 430,  // from viewbox - TODO: get this properly
			lineVertical = svgHeight;

		// clear any old legend
		d3.selectAll(".legend").remove();

		for (i = 0; i < 4; i++) {
			if (i === 0) {
				strokeWidth = this.maxArrowWidth;
				value = this.maxSourceQuantity;
			} else if (i === 1) {
				strokeWidth = this.maxArrowWidth * 0.5;
				value = this.maxSourceQuantity * 0.5;
			} else if (i === 2) {
				strokeWidth = this.maxArrowWidth * 0.25;
				value = this.maxSourceQuantity * 0.25;
			} else {
				strokeWidth = this.minArrowWidth;
				value = (this.maxSourceQuantity * this.minArrowWidth) / this.maxArrowWidth;
			}
			valueText = value.toFixed(1);
			if (i === 3) {
				valueText = "< " + valueText;
			}

			lineVertical = lineVertical - (Math.max(strokeWidth, 8) + margin);

			this.mapsvg.append("line")
				.attr("x1", margin)
				.attr("y1", lineVertical)
				.attr("x2", margin + lineLength)
				.attr("y2", lineVertical)
				.attr("stroke-width", strokeWidth)
				.attr("class", "legend traderoute");

			this.mapsvg.append("text")
				.attr("x", lineLength + (margin * 2))
				.attr("y", lineVertical + 5)
				.attr("class", "legend traderoute-label")
				.text(valueText);
		}

		// Now add a legend for the circles
		circleX = lineLength + (margin * 3) +
			this.maxSourceQuantity.toFixed(1).length * 8;
		circleY = svgHeight - 50;
		this.drawPoint(circleX, circleY, "source", "legend");
		this.mapsvg.append("text")
			.attr("x", circleX + 10)
			.attr("y", circleY + 5)
			.attr("class", "legend tradenode-label")
			.text("Source");

		circleY = circleY - 25;
		this.drawPoint(circleX, circleY, "transit", "legend");
		this.mapsvg.append("text")
			.attr("x", circleX + 10)
			.attr("y", circleY + 5)
			.attr("class", "legend tradenode-label")
			.text("Transit");

		circleY = circleY - 25;
		this.drawPoint(circleX, circleY, "dest", "legend");
		this.mapsvg.append("text")
			.attr("x", circleX + 10)
			.attr("y", circleY + 5)
			.attr("class", "legend tradenode-label")
			.text("Destination");
	}

	};
});
