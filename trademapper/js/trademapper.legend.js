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

		var draw = function () {
			// padding within the column (left, top and bottom)
			var padding = 8;
			var fontSize = 12;

			// remove old legend
			$("#legendcontainer").remove();

			// make a new one
			var legendContainer = mapsvg.append("svg")
				.attr("id", "legendcontainer")
				.attr("class", "legend")
				.attr("x", "76%") // pin at 76% of map width
				.attr("y", "10");

			var gLegend = legendContainer.append("g").attr("class", "legend");
			var legendBackground = gLegend.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", 100)
				.attr("height", 100)
				.attr("class", "legend legend-background");

			// which columns do we need in the legend?
			// a column consists of the required SVG element for each row, height
			// per row, and width properties; the tallest column sets the height of the
			// whole legend, and the combined widths of the columns sets the legend's width
			var columns = [];

			// layers
			if (state.layers.length > 0) {
			}


			var legendContainer, gLegend, i, strokeWidth, value, valueText, circleX, circleY,
				xOffset = 100,
				yOffset = 100,
				margin = 10,
				lineLength = state.maxArrowWidth + 5,
				maxWidth = state.maxArrowWidth,
				roundUpWidth = function (factor) { return Math.max(maxWidth*factor, 8); },
				legendHeight = Math.max(90, margin*3 + 8 + roundUpWidth(1) + roundUpWidth(0.25) + roundUpWidth(0.25)),
				legendWidth = lineLength + margin*4 + 10 + state.maxQuantity.toFixed(1).length*8 + 20,
				svgHeight = 0,
				lineVertical = svgHeight;

			// routes
			if (state.maxQuantity > 0) {
				for (i = 0; i < 4; i++) {
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

					lineVertical = lineVertical - (Math.max(strokeWidth, 8) + margin);

					gLegend.append("rect")
						.attr("x", margin + xOffset)
						.attr("y", lineVertical - (strokeWidth/2) + yOffset)
						.attr("width", lineLength)
						.attr("height", strokeWidth)
						.attr("fill", "url(#legendGradient)")
						.attr("class", "legend traderoute");

					gLegend.append("text")
						.attr("x", lineLength + xOffset + (margin +5))
						.attr("y", lineVertical + 2.5 + yOffset)
						.attr("font-size", "0.5em")
						.attr("font-family", config.styles["FONT_FAMILY"])
						.attr("class", "legend traderoute-label")
						.text(valueText);
				}

				gLegend.append("text")
						.attr("x", margin + xOffset)
						.attr("y", 18)
						.attr("font-size", "0.5em")
						.attr("font-family", config.styles["FONT_FAMILY"])
						.attr("class", "legend traderoute-label")
						.text('Routes →');
			}

			// nodes
			circleX = lineLength + xOffset + (margin * 2) + state.maxQuantity.toFixed(1).length * 7;
			circleY = 0;

			// sort roles by point size
			var possibleRoles = sortRolesByPointSize(state.pointTypeSize);

			// only show the roles which are in the data
			for (i = 0; i < possibleRoles.length; i++) {
				if (state.locationRoles.indexOf(possibleRoles[i]) !== -1) {
					circleY += 18;
					drawPointRoleLabel(possibleRoles[i], gLegend, circleX, circleY);
				}
			}
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
