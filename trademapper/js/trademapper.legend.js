define(["d3", "config"], function (d3, config) {
	// constructor
	//
	// mapsvg: d3 selection to append the legend to
	return function (mapsvg) {
		var obj = {};
		var pointTypeSize = config.pointTypeSize;
		var minArrowWidth = config.minArrowWidth;
		var maxArrowWidth = config.maxArrowWidth;

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
			if (!pointTypeSize.hasOwnProperty(pointType)) {
				console.log("unknown pointType: " + pointType);
				return;
			}

			// set tradenode fill depending on the type of point
			svgContainer.append("circle")
				.attr("cx", x)
				.attr("cy", y)
				.attr("r", pointTypeSize[pointType])
				.attr("data-orig-r", pointTypeSize[pointType])
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

		// maxQuantity: depends on the data loaded
		// locationRoles: array of one or more values from trademapper.route,
		// locationRoles property
		obj.draw = function (maxQuantity, locationRoles) {
			// just to protect ourselves in case we try to draw the legend without
			// setting max quantity first
			if (!maxQuantity) {
				console.error("Trying to draw legend without setting maxQuantity");
				maxQuantity = 1;
			}

			// use parseFloat as the height has "px" at the end
			var legendContainer, gLegend, i, strokeWidth, value, valueText, circleX, circleY,
				xOffset = 100,
				yOffset = 100,
				margin = 10,
				lineLength = maxArrowWidth + 5,
				maxWidth = maxArrowWidth,
				roundUpWidth = function (factor) { return Math.max(maxWidth*factor, 8); },
				legendHeight = Math.max(90, margin*3 + 8 + roundUpWidth(1) + roundUpWidth(0.25) + roundUpWidth(0.25)),
				legendWidth = lineLength + margin*4 + 10 + maxQuantity.toFixed(1).length*8 + 20,
				svgHeight = 0,
				lineVertical = svgHeight;

			// clear any old legend
			mapsvg.selectAll(".legend").remove();
			legendContainer = mapsvg.append("svg")
				.attr("id", "legendcontainer")
				.attr("class", "legend")
				.attr("x", "76%") // pin at 76% of map width
				.attr("y", "10");
			gLegend = legendContainer.append("g").attr("class", "legend");

			gLegend.append("rect")
				.attr("x", 5 + xOffset)
				.attr("y", svgHeight - (margin) - legendHeight + yOffset)
				.attr("width", legendWidth)
				.attr("height", legendHeight)
				.attr("class", "legend legend-background");

			for (i = 0; i < 4; i++) {
				if (i === 0) {
					strokeWidth = maxArrowWidth;
					value = maxQuantity;
				} else if (i === 1) {
					strokeWidth = maxArrowWidth * 0.5;
					value = maxQuantity * 0.5;
				} else if (i === 2) {
					strokeWidth = maxArrowWidth * 0.25;
					value = maxQuantity * 0.25;
				} else {
					strokeWidth = minArrowWidth;
					value = (maxQuantity * minArrowWidth) / maxArrowWidth;
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

			// Now add a legend for the circles
			circleX = lineLength + xOffset + (margin * 2) + maxQuantity.toFixed(1).length * 7;
			circleY = 0;

			for (i = 0; i < locationRoles.length; i++) {
				circleY += 18;
				drawPointRoleLabel(locationRoles[i], gLegend, circleX, circleY);
			}
		};

		return obj;
	};
});
