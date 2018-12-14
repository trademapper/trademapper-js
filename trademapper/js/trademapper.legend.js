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

		var drawPoint = function (x, y, pointType, extraclass, svgContainer) {
			if (!state.pointTypeSize.hasOwnProperty(pointType)) {
				console.log("unknown pointType: " + pointType);
				return;
			}

			// set tradenode fill depending on the type of point
			svgContainer.append("circle")
				.attr("cx", x)
				.attr("cy", y)
				.attr("r", state.pointTypeSize[pointType])
				.attr("data-orig-r", state.pointTypeSize[pointType])
				.attr("class", "tradenode " + pointType + " " + extraclass);
		};

		var drawPointRoleLabel = function (role, gLegend, circleX, circleY) {
			var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
			if (roleLabel) {
				drawPoint(circleX, circleY, role, "legend", gLegend);
				gLegend.append("text")
					.attr("x", circleX + 10)
					.attr("y", circleY + 2.5)
					.attr("font-size", "0.5em")
					.attr("font-family", config.styles["FONT_FAMILY"])
					.attr("class", "legend tradenode-label")
					.text(roleLabel);
			}
		};

		// returns an object with column and maxHeight properties;
		// column: an array of arrays; each sub-array has two elements,
		// which should be spaced equally
		var makeRoutesElements = function (fontSizePx) {
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

			elements.column.push({label: text, graphic: null});

			// route lines and labels
			var strokeWidth, value, valueText;
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
				routeLine.attr("width", state.maxArrowWidth + (fontSizePx / 2));
				routeLine.attr("height", strokeWidth);
				routeLine.attr("fill", "url(#legendGradient)");
				routeLine.attr("class", "legend traderoute");

				var routeText = d3.create("svg:text");
				routeText.attr("data-offset-y", (strokeWidth / 2) + (fontSizePx / 2) - 1.5);
				routeText.attr("font-size", fontSizePx + "px");
				routeText.attr("font-family", config.styles["FONT_FAMILY"]);
				routeText.attr("class", "legend traderoute-label");
				routeText.text(valueText);

				elements.column.push({graphic: routeLine, label: routeText});
			}

			return elements;
		};

		var getOffsetX = function (elt) {
			var value = elt.attr("data-offset-x");
			if (value === null) {
				return 0;
			}
			return parseFloat(value);
		};

		var getOffsetY = function (elt) {
			var value = elt.attr("data-offset-y");
			if (value === null) {
				return 0;
			}
			return parseFloat(value);
		};

		var drawColumn = function (elements, columnOffsetX, columnOffsetY, padding, gLegend) {
			var rowHeight = elements.minHeight;
			var label, graphic, graphicWidth, offsetX, offsetY, labelX, labelY,
				graphicX, graphicY;

			for (var row = 0; row < elements.column.length; row++) {
				label = elements.column[row].label;
				graphic = elements.column[row].graphic;

				offsetX = columnOffsetX + padding;
				offsetY = columnOffsetY + padding + (row * rowHeight) + (row * padding);

				if (graphic !== null) {
					graphicWidth = parseFloat(graphic.attr("width"));

					// show the graphic then the label
					graphicX = offsetX + getOffsetX(graphic);
					graphicY = offsetY + getOffsetY(graphic);
					graphic.attr("x", graphicX);
					graphic.attr("y", graphicY);
					gLegend.node().appendChild(graphic.node());

					labelX = graphicX + graphicWidth + (padding / 2) + getOffsetX(label);
					labelY = offsetY + getOffsetY(label);
					label.attr("x", labelX);
					label.attr("y", labelY);
					gLegend.node().appendChild(label.node());
				} else {
					// no line, just show the label
					label.attr("x", offsetX + getOffsetX(label));
					label.attr("y", offsetY + getOffsetY(label));
					gLegend.node().appendChild(label.node());
				}
			}
		};

		var draw = function () {
			// just to protect ourselves in case we try to draw the legend without
			// setting max quantity first
			if (!state.maxQuantity) {
				console.error("Trying to draw legend without setting maxQuantity; using 1");
				state.maxQuantity = 1;
			}

			var fontSize = 8;
			var padding = fontSize;

			// clear any old legend
			d3.select("#legendcontainer").remove();

			var legendContainer = mapsvg.append("svg");
			legendContainer.attr("id", "legendcontainer");
			legendContainer.attr("class", "legend");

			var gLegend = legendContainer.append("g");
			gLegend.attr("class", "legend");

			var gRect = gLegend.append("rect");
			gRect.attr("class", "legend legend-background");

			// TODO make this generic to draw nodes and layers in legend too
			var previousColumnsWidth = 0;
			var totalColumnWidths = 0;

			// route lines and labels
			var elements = makeRoutesElements(fontSize);
			var columnOffsetX = previousColumnsWidth;
			var columnOffsetY = padding;
			drawColumn(elements, columnOffsetX, columnOffsetY, padding, gLegend);

			// TODO set dimensions based on the total width of columns
			gRect.attr("height", 100);
			gRect.attr("width", 100);

			// TODO use real width of the legend
			var viewbox = mapsvg.node().viewBox.baseVal;
			legendContainer.attr("y", padding);
			legendContainer.attr("x", viewbox.width - 150);

			// Now add a legend for the circles
			/*circleX = lineLength + xOffset + (margin * 2) + state.maxQuantity.toFixed(1).length * 7;
			circleY = 0;

			// sort roles by point size
			var possibleRoles = sortRolesByPointSize(state.pointTypeSize);

			// only show the roles which are in the data
			for (i = 0; i < possibleRoles.length; i++) {
				if (state.locationRoles.indexOf(possibleRoles[i]) !== -1) {
					circleY += 18;
					drawPointRoleLabel(possibleRoles[i], gLegend, circleX, circleY);
				}
			}*/
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
				draw();
			}
		};

		return legendObj;
	};
});
