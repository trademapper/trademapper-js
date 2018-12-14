
define(["d3", "spiralTree", "trademapper.route", "trademapper.portlookup", "trademapper.legend", "util", "config"], function(d3, flowmap, tmroute, portlookup, Legend, util, config){
	"use strict";
	return {
	mapsvg: null,
	zoomg: null,
	arrowg: null,
	svgdefs: null,
	config: null,
	pathTooltipSelector: null,
	pathTooltip: null,
	highlightedPath: null,
	flowmap: null,
	arrowColours: null,
	minArrowWidth: null,
	maxArrowWidth: null,
	pointTypeSize: null,
	countryCodeToInfo: null,
	maxQuantity: null,
	centerTerminals: null,
	narrowWideStrokeThreshold: 1.5,  // used for deciding whether to use narrow or wide arrows
	highlightOpacity: 1,
	currentUnit: "Any Unit",

	/*
	 * Save the svg we use for later user
	 * Add the arrow head to defs/marker in the SVG
	 */
	init: function(svgElement, zoomg, svgDefs, tooltipSelector, colours, minWidth, maxWidth, pointTypeSize, countryCodeToInfo) {
		this.mapsvg = svgElement;
		this.zoomg = zoomg;
		this.arrowg = this.zoomg.append("g").attr("class", "arrows");
		this.svgdefs = svgDefs;
		this.pathTooltipSelector = tooltipSelector;
		this.pathTooltip = d3.select(tooltipSelector);
		this.arrowColours = colours;
		this.minArrowWidth = minWidth;
		this.maxArrowWidth = maxWidth;
		this.pointTypeSize = pointTypeSize;
		this.countryCodeToInfo = countryCodeToInfo;
		this.addDefsToSvg();
		this.setUpFlowmap();
		this.pathTooltip.style("opacity", 0);
		this.legend = Legend(this.mapsvg);

		// force drawing the legend
		this.legend.draw();
	},

	addDefsToSvg: function() {
		// first add arrow head
		// Flow tree arrows
		this.svgdefs.append("marker")
				.attr("id", "markerFlowmapTreeArrowWide")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "strokeWidth")
				.attr("refX", "7")
				.attr("refY", "5")
				.attr("markerWidth", "1")
				.attr("markerHeight", "1.4")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 9 2 L 3 5 L 9 8 z")
				.attr("class", "route-arrow-head-wide");

		this.svgdefs.append("marker")
				.attr("id", "markerFlowmapTreeArrowNarrow")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "userSpaceOnUse")
				.attr("refX", "7")
				.attr("refY", "5")
				.attr("markerWidth", "2")
				.attr("markerHeight", "8")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 10 0 L 0 5 L 10 10 z")
				.attr("class", "route-arrow-head-narrow");
		// Plain arrows
		this.svgdefs.append("marker")
				.attr("id", "markerPlainArrowWide")
				.attr("viewBox", "0 0 10 10")
				.attr("markerUnits", "strokeWidth")
				.attr("refX", "15")
				.attr("refY", "5")
				.attr("markerWidth", "0.8")
				.attr("markerHeight", "1.4")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 1 2 L 10 5 L 1 8 z")
				.attr("class", "route-arrow-head-wide");

		this.svgdefs.append("marker")
				.attr("id", "markerPlainArrowNarrow")
				.attr("viewBox", "0 0 26 26")
				.attr("markerUnits", "userSpaceOnUse")
				.attr("refX", "45")
				.attr("refY", "6")
				.attr("markerWidth", "5")
				.attr("markerHeight", "12")
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M 0 0 L 24 6 L 0 12 z")
				.attr("class", "route-plain-arrow-head-narrow");

		// this is for the legend
		var legendGradient = this.svgdefs.append("linearGradient")
			.attr("id", "legendGradient");
			/*.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 1)
			.attr("y2", 0);*/
		legendGradient.append("stop")
			.attr("offset", "30%")
			.attr("stop-color", this.arrowColours.pathStartColour)
			.attr("stop-opacity", this.arrowColours.pathStartOpacity);
		legendGradient.append("stop")
			.attr("offset", "70%")
			.attr("stop-color", this.arrowColours.pathEndColour)
			.attr("stop-opacity", this.arrowColours.pathEndOpacity);
	},

	setUpFlowmap: function() {
		this.flowmap = new flowmap.SpiralTree(this.zoomg, function(xy) { return [xy[1], xy[0]]; });
		this.flowmap.extraFlowmapClass = "traderoute zoompath";
		// any transparency leads to circles on path joins, which users often
		// interpret as a point.  So for flowmaps, never use transparency.
		this.flowmap.setOpacity(1);
		this.flowmap.setNodeDrawable(false);
		this.flowmap.markerStart.wide = null;
		this.flowmap.markerStart.narrow = "url(#markerFlowmapTreeArrowNarrow)";
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
			return d3.line()
				.curve(d3.curveCatmullRom)
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
			.attr("offset", "30%")
			.attr("stop-color", this.arrowColours.pathStartColour)
			.attr("stop-opacity", this.arrowColours.pathStartOpacity);
		gradient.append("stop")
			.attr("offset", "70%")
			.attr("stop-color", this.arrowColours.pathEndColour)
			.attr("stop-opacity", this.arrowColours.pathEndOpacity);

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

		this.arrowg.append("path")
			.datum(route.points)
			.attr("class", "route-arrow zoompath " + route.toHtmlId())
			.attr("d", this.dForRoute(route))
			.attr("marker-end", markerEnd)
			.attr("stroke", "url(#" + gradientId + ")")
			.attr("stroke-width", arrowWidth)
			.attr("stroke-linejoin", "round")
			.attr("fill", "none")
			.attr("data-origwidth", arrowWidth)
			.on('mouseover', this.createPlainMouseOverFunc(route))
			.on('mouseout', this.plainMouseOutPath.bind(this));
	},

	drawRouteCollectionPlainArrows: function(collection, pointRoles, maxQuantity) {
		this.clearArrows();
		this.clearPoints();
		if (maxQuantity) {
			this.maxQuantity = maxQuantity;
		} else {
			this.maxQuantity = collection.maxQuantity();
		}
		// round to 2 significant digits
		this.maxQuantity = parseFloat(this.maxQuantity.toPrecision(2));

		var routeList = collection.getRoutes();
		for (var i = 0; i < routeList.length; i++) {
			if (routeList[i].points.length >= 2) {
				this.drawRoute(routeList[i]);
			}
		}
		this.drawPointRoles(pointRoles);
	},

	drawRouteCollectionFlowmap: function(collection, pointRoles, maxQuantity) {
		var center, terminals;
		var ctAndMax = collection.getCenterTerminalList();
		this.centerTerminals = ctAndMax.centerTerminalList;
		if (maxQuantity) {
			this.maxQuantity = maxQuantity;
		} else {
			this.maxQuantity = ctAndMax.maxSourceQuantity;
		}
		// round to 2 significant digits
		this.maxQuantity = parseFloat(this.maxQuantity.toPrecision(2));
		this.flowmap.clearSpiralPaths();
		this.clearPoints();
		this.flowmap.setMaxQuantity(this.maxQuantity);
		for (var i = 0; i < this.centerTerminals.length; i++) {
			center = this.centerTerminals[i].center;
			terminals = this.centerTerminals[i].terminals;
			// set up flowmap settings for this path
			this.flowmap.extraSpiralClass = "traderoute zoompath center-" + center.point.toString();
			this.flowmap.mouseOverFunc = this.createFlowmapMouseOverFunc(i);
			this.flowmap.mouseOutFunc = this.flowmapMouseOutPath;
			// now do preprocess and drawing
			this.flowmap.preprocess(terminals, center);
			this.flowmap.drawTree();
		}
		this.drawPointRoles(pointRoles);
	},

	drawPoint: function(x, y, pointType, extraclass, svgContainer) {
		if (!this.pointTypeSize.hasOwnProperty(pointType)) {
			console.log("unknown pointType: " + pointType);
			return;
		}

		// set tradenode fill depending on the type of point
		svgContainer.append("circle")
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", this.pointTypeSize[pointType])
			.attr("data-orig-r", this.pointTypeSize[pointType])
			.attr("class", "tradenode " + pointType + " " + extraclass);
	},

	drawPointRole: function(point, pointType, pointName) {
		if (point === undefined) {
			console.log("point undefined for " + pointName);
			return;
		}
		this.drawPoint(point[0], point[1], pointType, "", this.arrowg);
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

	addDragToPathTooltip: function() {
		// inspired by http://jsfiddle.net/wfbY8/737/
		var offX, offY, box,
		moduleThis = this,
		mouseUp = function() {
			window.removeEventListener("mousemove", divMove, true);
		},
		mouseDown = function(e) {
			var div = document.querySelector(moduleThis.pathTooltipSelector);
			offY = e.clientY - parseInt(div.offsetTop);
			offX = e.clientX - parseInt(div.offsetLeft);
			box = document.querySelector("#mapcanvas").parentNode.getBoundingClientRect();
			window.addEventListener("mousemove", divMove, true);
		},
		divMove = function(e) {
			var div = document.querySelector(moduleThis.pathTooltipSelector),
				divH = div.clientHeight,
				divW = div.clientWidth,
				newTop = Math.max(0, Math.min(box.height - divH, (e.clientY - offY))),
				newLeft = Math.max(0, Math.min(box.width - divW, (e.clientX - offX)));

			div.style.top = newTop + "px";
			div.style.left = newLeft + "px";
		};

		document.querySelector("p.tooltip-header").addEventListener("mousedown", mouseDown, false);
		window.addEventListener("mouseup", mouseUp, false);
	},

	showPathTooltip: function(tooltiptext, tooltipWidth, tooltipHeight) {
		var moduleThis = this,
			box = util.getPageOffsetRect(document.querySelector("#mapcanvas")),
			containerBox = document.querySelector("#mapcanvas").parentNode.getBoundingClientRect();

		tooltiptext = '<p class="tooltip-header"><span class="tooltip-close">X</span></p>' + tooltiptext;

		this.pathTooltip
			.style("width", tooltipWidth)
			.style("height", tooltipHeight)
			.html(tooltiptext);

		// make sure we're not outside the box
		var divTooltip = document.querySelector(moduleThis.pathTooltipSelector),
			divH = divTooltip.clientHeight,
			divW = divTooltip.clientWidth,
			newTop = Math.max(0, Math.min(containerBox.height - divH, (d3.event.pageY - box.top + 30))),
			newLeft = Math.max(0, Math.min(containerBox.width - divW, (d3.event.pageX - box.left)));
		this.pathTooltip
			.style("top", newTop + "px")
			.style("left", newLeft + "px");

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
		this.setPathOpacity(this.highlightedPath, this.arrowColours.opacity);
		// make the path non-transparent
		this.highlightedPath = route.toHtmlId();
		this.setPathOpacity(this.highlightedPath, this.highlightOpacity);

		// set the path stroke colour
		d3.selectAll("." + this.highlightedPath).style("stroke", '#FF0000');

		// now do the tooltip
		var pathSelector = ".route-arrow." + route.toHtmlId(),
			tooltiptext = '<div class="tooltip-summary">';

		tooltiptext += '<span class="tooltip-quantity">' + Math.round(route.quantity).toLocaleString() + '</span>';
		tooltiptext += '<span class="tooltip-total">Total quantity on route:</span><br />';
		tooltiptext += '<span class="tooltip-units">Unit: ' + this.currentUnit + '</span>';
		tooltiptext += '</div><div class="tooltip-pointlist">';

		var makePointFilter = function(role) {
			return function(point) {
				return point.roles.roles[role];
			};
		};

		var rolesUsed = 0;
		for (var i = 0; i < tmroute.locationRoles.length; i++) {
			var role = tmroute.locationRoles[i],
				pointsWithRole = route.points.filter(makePointFilter(role));

			if (pointsWithRole.length) {
				rolesUsed++;
				tooltiptext += '<p class="tooltip-location ' + role + '" title="' + role + '">' +
					'<span class="location-role-icon ' + role + '">' +
					role.charAt(0).toUpperCase() + '</span>';
				for (var j = 0; j < pointsWithRole.length; j++) {
					var titleAttr = '',
						code = pointsWithRole[j].getCode();
					if (this.countryCodeToInfo.hasOwnProperty(code)) {
						titleAttr = ' title="' + this.countryCodeToInfo[code].formal_en + '"';
					} else {
						var port = portlookup.getPortDetails(code);
						if (port) {
							titleAttr = ' title="' + port.name + '"';
						}
					}
					tooltiptext += ' <span class="location-role-country ' +
						code + '"' + titleAttr + '>' + code + '</span>';
				}
				tooltiptext += '</p>';
			}
		}
		tooltiptext += '</div>';

		var tooltipHeight = 1.6 * (4 + rolesUsed) + "em";
		this.showPathTooltip(tooltiptext, "17em", tooltipHeight);
	},

	createPlainMouseOverFunc: function(route) {
		var moduleThis = this;
		return function() { moduleThis.plainMouseOverPath(route); };
	},

	plainMouseOutPath: function() {
		// remove path stroke
		d3.selectAll("." + this.highlightedPath).style('stroke', null);
		this.setPathOpacity(this.highlightedPath, this.arrowColours.opacity);
		this.highlightedPath = null;
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
			.duration(250)
			.style("opacity", 0);
	},

	drawLegend: function(state) {
		// the legend decides when to draw itself based on state changes
		if (!state) {
			state = {};
		}
		state.maxQuantity = this.maxQuantity || 0;
		this.legend.setState(state);
	},

	};
});
