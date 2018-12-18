define(["d3", "jquery", "config"], function (d3, $, config) {
	// constructor
	//
	// mapsvg: d3 selection to append the legend to
	return function (mapsvg) {
		var legendObj = {};

		// sort roles by point size; returns array of role names
		var sortRolesByPointSize = function (pointSizes) {
			var condensed = [];
			for (var role in pointSizes) {
				condensed.push([role, pointSizes[role]]);
			}

			condensed = condensed.sort(function (a, b) {
				return ("" + b[1]).localeCompare("" + a[1]);
			});

			var roles = [];
			for (var i = 0; i < condensed.length; i++) {
				roles.push(condensed[i][0]);
			}

			return roles;
		};

		// - locationRoles: array of one or more values from trademapper.route,
		//   locationRoles property
		// - pointTypeSize: map from role names to point sizes, e.g.
		//   {origin: 5.5, exporter: 4, ...}
		// - layers: Layer objects to render entries for in the legend
		var state = {
			pointTypeSize: config.pointTypeSize,
			minArrowWidth: config.minArrowWidth,
			maxArrowWidth: config.maxArrowWidth,
			maxQuantity: 0,
			locationRoles: [],
			layers: [],
		};

		var formatLegendValue = function (labelValue) {
			var abs = Math.abs(Number(labelValue));
			return abs >= 1.0e+9 ?
				(abs / 1.0e+9).toFixed(0) + " billion"
				// Six Zeroes for Millions
				: abs >= 1.0e+6 ?
					(abs / 1.0e+6).toFixed(0) + " million"
					: abs.toFixed(0);
	 	};

		var getOffsetX = function (elt) {
			return parseFloat(elt.attr("data-offset-x")) || 0;
		};

		var getOffsetY = function (elt) {
			return parseFloat(elt.attr("data-offset-y")) || 0;
		};

		// returns diameter for svg:circle, width for svg:rect
		var getWidth = function (elt) {
			var nodeName = elt.node().nodeName.toLowerCase();
			if (nodeName === "rect") {
				return parseFloat(elt.attr("width")) || 0;
			} else if (nodeName === "circle") {
				return parseFloat(elt.attr("r") * 2) || 0;
			}
		};

		// returns an object with column and maxHeight properties;
		// column: an array of arrays; each sub-array has two elements,
		// which should be spaced equally
		var makeRouteElements = function (fontSizePx) {
			var elements = {
				column: [],
				minHeight: fontSizePx,
			};

			// heading
			var text = d3.create("svg:text");
			text.attr("font-size", fontSizePx + "px");
			text.attr("font-family", config.styles["FONT_FAMILY"]);
			text.attr("class", "legend traderoute-label");
			text.text('Routes →');
			text.attr("data-offset-y", (fontSizePx / 2) - 1.5);

			elements.column.push({label: text, graphic: null});

			// route lines and labels
			var strokeWidth, value, valueText;
			var routeWidth = state.maxArrowWidth + (fontSizePx / 2);
			for (i = 3; i >= 0; i--) {
				if (i === 0) {
					strokeWidth = state.maxArrowWidth;
					value = state.maxQuantity;
				} else if (i === 1) {
					strokeWidth = state.maxArrowWidth * 0.5;
					value = state.maxQuantity * 0.5;
				} else if (i === 2) {
					strokeWidth = state.maxArrowWidth * 0.25;
					value = state.maxQuantity * 0.25;
				} else {
					strokeWidth = state.minArrowWidth;
					value = (state.maxQuantity * state.minArrowWidth) / state.maxArrowWidth;
				}
				valueText = formatLegendValue(value);
				if (i === 3) {
					valueText = "< " + valueText;
				}

				if (strokeWidth > elements.minHeight) {
					elements.minHeight = strokeWidth;
				}

				var routeLine = d3.create("svg:rect");
				routeLine.attr("width", routeWidth);
				routeLine.attr("height", strokeWidth);
				routeLine.attr("fill", "url(#legendGradient)");
				routeLine.attr("class", "legend traderoute");

				var routeText = d3.create("svg:text");
				routeText.attr("data-offset-x", routeWidth + (fontSizePx / 2));
				routeText.attr("data-offset-y", (strokeWidth / 2) + (fontSizePx / 2) - 1.5);
				routeText.attr("font-size", fontSizePx + "px");
				routeText.attr("font-family", config.styles["FONT_FAMILY"]);
				routeText.attr("class", "legend traderoute-label");
				routeText.text(valueText);

				elements.column.push({graphic: routeLine, label: routeText});
			}

			return elements;
		};

		var makeTradenodeElements = function (fontSizePx) {
			var widest = 0;
			var elements = {column: [], minHeight: 0};

			// sort roles by point size, largest first
			var possibleRoles = sortRolesByPointSize(state.pointTypeSize);

			// only show the roles which are in the data
			for (var i = 0; i < possibleRoles.length; i++) {
				if (state.locationRoles.indexOf(possibleRoles[i]) !== -1) {
					var role = possibleRoles[i];

					var radius = state.pointTypeSize[role];
					if (radius * 2 > widest) {
						widest = radius * 2;
					}

					var graphic = d3.create("svg:circle");
					graphic.attr("r", radius);
					graphic.attr("data-orig-r", radius);
					graphic.attr("class", "legend tradenode " + role);

					var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

					var label = d3.create("svg:text");
					label.attr("font-size", fontSizePx + "px");
					label.attr("font-family", config.styles["FONT_FAMILY"]);
					label.attr("class", "legend tradenode-label");
					label.text(roleLabel);

					elements.column.push({graphic: graphic, label: label});
				}
			}

			// padding is based on the largest circle, so that the centres of
			// the circles line up, and the left-hand edges of the labels line up
			for (i = 0; i < elements.column.length; i++) {
				graphic = elements.column[i].graphic;
				graphic.attr("data-offset-x", widest / 2);
				graphic.attr("data-offset-y", 0);

				label = elements.column[i].label;
				label.attr("data-offset-x", widest + (fontSizePx / 2));
				label.attr("data-offset-y", (fontSizePx / 2) - 1.5);
			}

			elements.minHeight = widest;
			return elements;
		};

		var makeLayerElements = function (fontSizePx) {
			var elements = {column: [], minHeight: fontSizePx * 2};
			var graphicWidth = fontSizePx * 2;
			var graphicHeight = fontSizePx;

			for (var i = 0; i < state.layers.length; i++) {
				var graphic = d3.create("svg:rect");
				graphic.attr("width", graphicWidth);
				graphic.attr("height", graphicHeight);
				graphic.attr("fill", state.layers[i].colour);
				graphic.attr("class", "legend");
				graphic.attr("data-offset-y", -(graphicHeight / 2));

				var layerName = state.layers[i].filename.replace(/\.json/, '').substr(0, 10);
				var label = d3.create("svg:text");
				label.attr("font-size", fontSizePx + "px")
				label.attr("font-family", config.styles["FONT_FAMILY"])
				label.attr("class", "legend")
				label.text(layerName);
				label.attr("data-offset-x", graphicWidth + (fontSizePx / 2));
				label.attr("data-offset-y", (fontSizePx / 2) - 1.5);

				elements.column.push({label: label, graphic: graphic});
			}

			return elements;
		};

		var makeMapElements = function (fontSizePx) {
			var elements = {column: [], minHeight: fontSizePx * 2};

			var graphicWidth = fontSizePx * 2;
			var graphicHeight = fontSizePx;

			var mapFeatures = {
				"No trade data": {
					"class": "country",
				},
				"Trade data": {
					"class": "country trading",
				},
				"Disputed area": {
					"class": "disputed",
				},
			};

			for (var labelText in mapFeatures) {
				var graphic = d3.create("svg:rect");
				graphic.attr("width", graphicWidth);
				graphic.attr("height", graphicHeight);
				graphic.attr("class", "legend " + mapFeatures[labelText]["class"]);
				graphic.attr("data-offset-y", -(graphicHeight / 2));

				var label = d3.create("svg:text");
				label.attr("font-size", fontSizePx + "px")
				label.attr("font-family", config.styles["FONT_FAMILY"])
				label.attr("class", "legend")
				label.text(labelText);
				label.attr("data-offset-x", graphicWidth + (fontSizePx / 2));
				label.attr("data-offset-y", (fontSizePx / 2) - 1.5);

				elements.column.push({label: label, graphic: graphic});
			}

			return elements;
		};

		// this does the positioning of graphics and labels within a column of
		// the legend;
		// elements is a list of objects with "graphic" and "label" properties;
		// both graphic and label objects can have data-offset-x and data-offset-y
		// properties, which position the object with respect to the offset for
		// a row within the column; this is used to position text with the centre
		// of the route lines, offset the centre of circles etc.
		var drawColumn = function (elements, columnOffsetX, columnOffsetY, padding, gLegend) {
			var rowHeight = elements.minHeight;
			var label, graphic, graphicNode, graphicWidth, offsetX, offsetY, labelX,
				labelY,	graphicX, graphicY;

			for (var row = 0; row < elements.column.length; row++) {
				label = elements.column[row].label;
				graphic = elements.column[row].graphic;

				offsetX = columnOffsetX + padding;
				offsetY = columnOffsetY + padding + (row * rowHeight) + (row * padding);

				if (graphic !== null) {
					graphicNode = graphic.node();

					graphicX = offsetX + getOffsetX(graphic);
					graphicY = offsetY + getOffsetY(graphic);

					// set x, y for rectangles; cx, cy for circles
					if (graphicNode.nodeName.toLowerCase() === "rect") {
						graphic.attr("x", graphicX);
						graphic.attr("y", graphicY);
					} else if (graphicNode.nodeName.toLowerCase() === "circle") {
						graphic.attr("cx", graphicX);
						graphic.attr("cy", graphicY);
					}
					gLegend.node().appendChild(graphicNode);
				}

				labelX = offsetX + getOffsetX(label);
				labelY = offsetY + getOffsetY(label);
				label.attr("x", labelX);
				label.attr("y", labelY);
				gLegend.node().appendChild(label.node());
			}
		};

		legendObj.draw = function () {
			console.log("drawing legend");

			var padding = 8;
			var fontSizePx = padding;
			var columnOffsetY = padding;
			var columnOffsetX = 0;
			var columnWidth = 75;
			var numColumns = 0;

			// clear any old legend
			d3.select("#legendcontainer").remove();

			var legendContainer = mapsvg.append("svg");
			legendContainer.attr("id", "legendcontainer");
			legendContainer.attr("class", "legend");

			var gLegend = legendContainer.append("g");
			gLegend.attr("class", "legend");

			var gRect = gLegend.append("rect");
			gRect.attr("class", "legend legend-background");

			// layers
			if (state.layers.length > 0) {
				var layerElements = makeLayerElements(fontSizePx);
				columnOffsetX = numColumns * columnWidth;
				numColumns += 1;
				drawColumn(layerElements, columnOffsetX, columnOffsetY, padding, gLegend);
			}

			// routes
			if (state.maxQuantity > 0) {
				var routeElements = makeRouteElements(fontSizePx);
				columnOffsetX = numColumns * columnWidth;
				numColumns += 1;
				drawColumn(routeElements, columnOffsetX, columnOffsetY, padding, gLegend);
			}

			// trade nodes
			if (state.locationRoles.length > 0) {
				var tradeNodeElements = makeTradenodeElements(fontSizePx);
				columnOffsetX = numColumns * columnWidth;
				numColumns += 1;
				drawColumn(tradeNodeElements, columnOffsetX, columnOffsetY, padding, gLegend);
			}

			// map colours (always shown)
			var mapElements = makeMapElements(fontSizePx);
			columnOffsetX = numColumns * columnWidth;
			numColumns += 1;
			drawColumn(mapElements, columnOffsetX, columnOffsetY, padding, gLegend);

			// position the legend and its background
			var legendWidth = numColumns * (columnWidth + padding);
			gRect.attr("height", 100);
			gRect.attr("width", legendWidth);

			var viewbox = mapsvg.node().viewBox.baseVal;
			legendContainer.attr("y", padding);
			legendContainer.attr("x", viewbox.width - legendWidth - 25);
		};

		// set the state for the legend; if state changes, redraw;
		// see the state variable for valid keys for newState
		legendObj.setState = function (newState) {
			var changed = false;

			for (var key in newState) {
				if (state[key] !== newState[key]) {
					state[key] = newState[key];
					changed = true;
				}
			}

			if (changed) {
				legendObj.draw();
			}
		};

		return legendObj;
	};
});
