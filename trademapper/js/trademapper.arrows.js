
define(["d3", "spiralTree", "trademapper.route", "util"], function(d3, spiralTree, tmroute, util) {
	"use strict";
	return {
	mapsvg: null,
	pathTooltipSelector: null,
	pathTooltip: null,
	highlightedPath: null,
	config: null,
	svgdefs: null,
	flowmap: null,
	arrowColours: null,
	minArrowWidth: null,
	maxArrowWidth: null,
	maxQuantity: null,
	centerTerminals: null,
	narrowWideStrokeThreshold: 3,  // used for deciding whether to use arrows inside or outside line
	normalOpacity: 0.4,
	highlightOpacity: 1,
	currentUnit: "Any Unit",

	/*
	 * Save the svg we use for later user
	 * Add the arrow head to defs/marker in the SVG
	 */
	init: function(svgElement, tooltipSelector, colours, minWidth, maxWidth) {
		this.mapsvg = svgElement;
		this.pathTooltipSelector = tooltipSelector;
		this.pathTooltip = d3.select(tooltipSelector);
		this.arrowColours = colours;
		this.minArrowWidth = minWidth;
		this.maxArrowWidth = maxWidth;
		this.addDefsToSvg();
		this.setUpFlowmap();
		this.pathTooltip.style("opacity", 0);
	},

	addDefsToSvg: function() {
		this.svgdefs = this.mapsvg.select("defs");
		// first add arrow head
		this.svgdefs.append("marker")
				.attr("id", "markerSpiralTreeArrowWide")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "strokeWidth")
				.attr("refX", "7")
				.attr("refY", "5")
				.attr("markerWidth", "0.7")
				.attr("markerHeight", "1.4")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 9 2 L 3 5 L 9 8 z")
				.attr("class", "route-arrow-head-wide");

		this.svgdefs.append("marker")
				.attr("id", "markerSpiralTreeArrowNarrow")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "userSpaceOnUse")
				.attr("refX", "7")
				.attr("refY", "5")
				.attr("markerWidth", "4")
				.attr("markerHeight", "8")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 10 0 L 0 5 L 10 10 z")
				.attr("class", "route-arrow-head-narrow");

		this.svgdefs.append("marker")
				.attr("id", "markerPlainArrowWide")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "strokeWidth")
				.attr("refX", "17")
				.attr("refY", "5")
				.attr("markerWidth", "0.8")
				.attr("markerHeight", "1.4")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 1 2 L 10 5 L 1 8 z")
				.attr("class", "route-arrow-head-wide");

		this.svgdefs.append("marker")
				.attr("id", "markerPlainArrowNarrow")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "userSpaceOnUse")
				.attr("refX", "20")
				.attr("refY", "5")
				.attr("markerWidth", "4")
				.attr("markerHeight", "8")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 0 0 L 10 5 L 0 10 z")
				.attr("class", "route-plain-arrow-head-narrow");
	},

	setUpFlowmap: function() {
		this.flowmap = new spiralTree.SpiralTree(this.mapsvg, function(xy) { return [xy[1], xy[0]]; });
		this.flowmap.extraSpiralClass = "traderoute";
		this.flowmap.setOpacity(this.normalOpacity);
		this.flowmap.setNodeDrawable(false);
		this.flowmap.markerStart.wide = "url(#markerSpiralTreeArrowWide)";
		this.flowmap.markerStart.narrow = "url(#markerSpiralTreeArrowNarrow)";
		this.flowmap.narrowWideStrokeThreshold = this.narrowWideStrokeThreshold;
	},

	getArrowWidth: function(route) {
		var width = (route.quantity / this.maxQuantity) * this.maxArrowWidth;
		return Math.max(width, this.minArrowWidth);
	},

	clearArrows: function() {
		d3.selectAll('.route-arrow').remove();
	},

	dForRoute: function(route) {
		if (route.points.length === 2) {
			// do a link arc
			var start = route.points[0].point,
				end = route.points[1].point,
				dx = start[0] - end[0],
				dy = start[1] - end[1],
				dr = Math.sqrt(dx*dx + dy*dy);
			return "M" + start[0] + "," + start[1] + "A" + dr + "," + dr +
				" 0 0,1 " + end[0] + "," + end[1];
		} else {
			return d3.svg.line()
				.interpolate("monotone")
				.x(function(d) { return d.point[0]; })
				.y(function(d) { return d.point[1]; });
		}
	},

	addGradientForRoute: function(route) {
		var gradient, denominator, x1, x2, y1, y2,
			start = route.points[0].point,
			end = route.points[route.points.length-1].point,
			gradientId = "route-grad-" + route.toHtmlId();

		// normalise the variables - all numbers must be between 0 and 1
		denominator = Math.max(Math.abs(start[0] - end[0]), Math.abs(start[1] - end[1]));
		x1 = (start[0] - Math.min(start[0], end[0])) / denominator;
		y1 = (start[1] - Math.min(start[1], end[1])) / denominator;
		x2 = (end[0] - Math.min(start[0], end[0])) / denominator;
		y2 = (end[1] - Math.min(start[1], end[1])) / denominator;

		gradient = this.svgdefs.append("linearGradient")
			.attr("id", gradientId)
			.attr("x1", x1)
			.attr("y1", y1)
			.attr("x2", x2)
			.attr("y2", y2);
		gradient.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", this.arrowColours.pathStart)
			.attr("stop-opacity", this.normalOpacity);
		gradient.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", this.arrowColours.pathEnd)
			.attr("stop-opacity", this.normalOpacity);

		return gradientId;
	},

	/*
	 * Draw a route - the route argument is basically a list of points
	 */
	drawRoute: function(route) {
		var markerEnd, gradientId,
			arrowWidth = this.getArrowWidth(route);
		if (arrowWidth < this.narrowWideStrokeThreshold) {
			markerEnd = "url(#markerPlainArrowNarrow)";
		} else {
			markerEnd = "url(#markerPlainArrowWide)";
		}

		gradientId = this.addGradientForRoute(route);

		this.mapsvg
			.append("path")
				.datum(route.points)
				.attr("class", "route-arrow " + route.toHtmlId())
				.attr("d", this.dForRoute(route))
				.attr("marker-end", markerEnd)
				.attr("stroke", "url(#" + gradientId + ")")
				.attr("stroke-width", arrowWidth)
				.on('mouseover', this.createPlainMouseOverFunc(route))
				.on('mouseout', this.genericMouseOutPath);
	},

	drawRouteCollectionPlainArrows: function(collection, pointRoles) {
		this.clearArrows();
		this.clearPoints();
		this.maxQuantity = parseFloat(collection.maxQuantity().toPrecision(2));
		var routeList = collection.getRoutes();
		for (var i = 0; i < routeList.length; i++) {
			if (routeList[i].points.length >= 2) {
				this.drawRoute(routeList[i]);
			}
		}
		this.drawPointRoles(pointRoles);
	},

	drawPoint: function(x, y, pointType, extraclass, svgContainer) {
		var pointTypeSize = {
				origin: 6,
				exporter: 5,
				transit: 4,
				importer: 3
			};

		if (!pointTypeSize.hasOwnProperty(pointType)) {
			console.log("unknown pointType: " + pointType);
			return;
		}

		svgContainer.append("circle")
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", pointTypeSize[pointType])
			.attr("class", "tradenode " + pointType + " " + extraclass);
	},

	drawPointRole: function(point, pointType, pointName) {
		if (point === undefined) {
			console.log("point undefined for " + pointName);
			return;
		}
		this.drawPoint(point[0], point[1], pointType, "", this.mapsvg);
	},

	drawPointRoles: function(pointRoles) {
		var pointInfo,
			pointKeys = Object.keys(pointRoles);

		for (var i = 0; i < pointKeys.length; i++) {
			pointInfo = pointRoles[pointKeys[i]];
			for (var j = 0; j < tmroute.locationRoles.length; j++) {
				var role = tmroute.locationRoles[j];
				if (pointInfo.roles.roles[role]) {
					this.drawPointRole(pointInfo.point, role, pointKeys[i]);
				}
			}
		}
	},

	clearPoints: function() {
		d3.selectAll(".tradenode").remove();
	},

	dragmovePathTooltip: function() {
		d3.select("#maptooltip")
			.style("left", d3.event.x + "px")
			.style("top", d3.event.y + "px");
	},

	addDragToPathTooltip: function() {
		// inspired by http://jsfiddle.net/wfbY8/737/
		var offX, offY,
		moduleThis = this,
		mouseUp = function() {
			window.removeEventListener("mousemove", divMove, true);
		},
		mouseDown = function(e) {
			var div = document.querySelector(moduleThis.pathTooltipSelector);
			offY = e.clientY - parseInt(div.offsetTop);
			offX = e.clientX - parseInt(div.offsetLeft);
			window.addEventListener("mousemove", divMove, true);
		},
		divMove = function(e) {
			var div = document.querySelector(moduleThis.pathTooltipSelector);
			div.style.top = (e.clientY - offY) + "px";
			div.style.left = (e.clientX - offX) + "px";
		};

		document.querySelector("p.tooltip-header").addEventListener("mousedown", mouseDown, false);
		window.addEventListener("mouseup", mouseUp, false);
	},

	showPathTooltip: function(tooltiptext, tooltipWidth, tooltipHeight) {
		var moduleThis = this,
			box = util.getOffsetRect(document.querySelector("#mapcanvas"));

		tooltiptext = '<p class="tooltip-header"><span class="tooltip-close">X</span></p>' + tooltiptext;

		this.pathTooltip
			.style("width", tooltipWidth)
			.style("height", tooltipHeight)
			.style("left", (d3.event.pageX - box.left) + "px")
			.style("top", (d3.event.pageY - box.top + 30) + "px")
			.html(tooltiptext);

		this.addDragToPathTooltip();

		// add the close button
		d3.select("span.tooltip-close")
			.on("click", function() { moduleThis.clearTooltip(); });

		this.pathTooltip.transition()
			.duration(200)
			.style("opacity", 0.9);
	},

	setPathOpacity: function(routeHtmlId, opacity) {
		if (!routeHtmlId) { return; }
		var i, gradientStops = document.querySelectorAll("#route-grad-" + routeHtmlId + " > stop");
		for (i = 0; i < gradientStops.length; i++) {
			gradientStops[i].setAttribute("stop-opacity", opacity);
		}
	},

	plainMouseOverPath: function(route) {
		// clear the last non-transparent path
		this.setPathOpacity(this.highlightedPath, this.normalOpacity);
		// make the path non-transparent
		this.highlightedPath = route.toHtmlId();
		this.setPathOpacity(this.highlightedPath, this.highlightOpacity);

		// now do the tooltip
		var pathSelector = ".route-arrow." + route.toHtmlId(),
			tooltipHeight = 1.6 * (4 + route.points.length) + "em",
			tooltiptext = '<div class="tooltip-summary">';

		tooltiptext += '<span class="tooltip-quantity">' + Math.round(route.quantity).toLocaleString() + '</span>';
		tooltiptext += '<span class="tooltip-total">Total quantity on route:</span><br />';
		tooltiptext += '<span class="tooltip-units">Unit: ' + this.currentUnit + '</span>';
		tooltiptext += '</div><div class="tooltip-pointlist">';

		for (var i = 0; i < route.points.length; i++) {
			tooltiptext += '<p class="tooltip-location">' + route.points[i].toString() + '</p>';
		}
		tooltiptext += '</div>';

		this.showPathTooltip(tooltiptext, "17em", tooltipHeight);
	},

	createPlainMouseOverFunc: function(route) {
		var moduleThis = this;
		return function() { moduleThis.plainMouseOverPath(route); };
	},

	plainMouseOutPath: function() {
		return;
		// TODO: decide what behaviour we want on mouseOut
		this.setPathOpacity(this.highlightedPath, this.normalOpacity);
		this.highlightedPath = null;
		this.clearTooltip();
	},

	flowmapMouseOverPath: function(ctIndex) {
		var tooltiptext,
			center = this.centerTerminals[ctIndex].center,
			terminals = this.centerTerminals[ctIndex].terminals,
			pathSelector = ".traderoute.center-" + center.point.toString(),
			tooltipHeight = 1.5 * (3 + terminals.length) + "em";

		// first make the paths stand out, and clear any old paths
		d3.selectAll(".traderoute-highlight").classed("traderoute-highlight", false);
		var allpath = d3.selectAll(pathSelector);
		allpath.classed("traderoute-highlight", true);

		// sort, largest quantity first (hence the order swap)
		terminals.sort(function(a, b) { return b.quantity - a.quantity; });

		tooltiptext = '<span class="tooltip-source">Source: ' +
			center.point.toString() + '</span>' +
			'<span class="tooltip-units">Unit: ' + this.currentUnit + '</span>';

		for (var i = 0; i < terminals.length; i++) {
			tooltiptext += '<br /><span class="tooltip-dest">to: <em>' +
				terminals[i].point.toString() + '</em> : ' + '<em>' +
				Math.round(terminals[i].quantity).toLocaleString() + '</em></span>';
		}

		this.showPathTooltip(tooltiptext, "17em", tooltipHeight);
	},

	createFlowmapMouseOverFunc: function(ctIndex) {
		var moduleThis = this;
		return function() { moduleThis.flowmapMouseOverPath(ctIndex); };
	},

	flowmapMouseOutPath: function() {
		return;
		// TODO: decide what behaviour we want on mouseOut
		d3.selectAll(".traderoute-highlight").classed("traderoute-highlight", false);
		this.clearTooltip();
	},

	clearTooltip: function() {
		this.pathTooltip.transition()
			.duration(500)
			.style("opacity", 0);
	},

	drawRouteCollectionSpiralTree: function(collection, pointRoles) {
		var center, terminals;
		var ctAndMax = collection.getCenterTerminalList();
		this.centerTerminals = ctAndMax.centerTerminalList;
		// round to 2 significant digits
		this.maxQuantity = parseFloat(ctAndMax.maxSourceQuantity.toPrecision(2));

		this.flowmap.clearSpiralPaths();
		this.clearPoints();
		this.flowmap.setMaxQuantity(this.maxQuantity);

		for (var i = 0; i < this.centerTerminals.length; i++) {
			center = this.centerTerminals[i].center;
			terminals = this.centerTerminals[i].terminals;
			// set up flowmap settings for this path
			this.flowmap.extraSpiralClass = "traderoute center-" + center.point.toString();
			this.flowmap.mouseOverFunc = this.createFlowmapMouseOverFunc(i);
			this.flowmap.mouseOutFunc = this.genericMouseOutPath;

			// now do preprocess and drawing
			this.flowmap.preprocess(terminals, center);
			this.flowmap.drawTree();
		}

		this.drawPointRoles(pointRoles);
	},

	drawPointRoleLabel: function(role, gLegend, circleX, circleY) {
		var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
		this.drawPoint(circleX, circleY, role, "legend", gLegend);
		gLegend.append("text")
			.attr("x", circleX + 10)
			.attr("y", circleY + 5)
			.attr("class", "legend tradenode-label")
			.text(roleLabel);
	},
	
	drawLegend: function() {
		// use parseFloat as the height has "px" at the end
		var gLegend, i, strokeWidth, value, valueText, circleX, circleY,
			margin = 10,
			lineLength = this.maxArrowWidth + 10,
			svgHeight = 430,  // from viewbox - TODO: get this properly
			lineVertical = svgHeight;

		// clear any old legend
		d3.selectAll(".legend").remove();

		for (i = 0; i < 4; i++) {
			if (i === 0) {
				strokeWidth = this.maxArrowWidth;
				value = this.maxQuantity;
			} else if (i === 1) {
				strokeWidth = this.maxArrowWidth * 0.5;
				value = this.maxQuantity * 0.5;
			} else if (i === 2) {
				strokeWidth = this.maxArrowWidth * 0.25;
				value = this.maxQuantity * 0.25;
			} else {
				strokeWidth = this.minArrowWidth;
				value = (this.maxQuantity * this.minArrowWidth) / this.maxArrowWidth;
			}
			valueText = value.toFixed(0);
			if (i === 3) {
				valueText = "< " + valueText;
			}

			lineVertical = lineVertical - (Math.max(strokeWidth, 8) + margin);

			gLegend = this.mapsvg.append("g").attr("class", "legend");
			gLegend.append("line")
				.attr("x1", margin)
				.attr("y1", lineVertical)
				.attr("x2", margin + lineLength)
				.attr("y2", lineVertical)
				.attr("stroke-width", strokeWidth)
				.attr("class", "legend traderoute");

			gLegend.append("text")
				.attr("x", lineLength + (margin * 2))
				.attr("y", lineVertical + 5)
				.attr("class", "legend traderoute-label")
				.text(valueText);
		}

		// Now add a legend for the circles
		circleX = lineLength + (margin * 3) +
			this.maxQuantity.toFixed(1).length * 8;
		circleY = svgHeight;

		for (i = tmroute.locationRoles.length-1; i >= 0; i--) {
			circleY -= 25;
			this.drawPointRoleLabel(tmroute.locationRoles[i], gLegend, circleX, circleY);
		}
	}

	};
});
