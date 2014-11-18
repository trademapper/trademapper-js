define(
	['QUnit', 'trademapper.arrows', 'd3'],
	function(q, arrows, d3) {
		"use strict";
		var arrowColours = {
			pathStart: "black",
			pathEnd: "orange"
		},
		
		run = function() {
			q.module("Arrows", {
				setup: function() {
					var newsvg = d3.select('#container').append('svg');
					var tooltip = d3.select('#container').append('div').attr("id", "tooltip-id");
					var svgdefs = newsvg.append('defs');
					var zoomg = newsvg.append('g');
					// init: function(svgElement, zoomg, svgDefs, tooltipSelector, colours, minWidth, maxWidth, pointTypeSize, countryCodeToInfo) {
					arrows.init(newsvg, zoomg, svgdefs, "tooltip-id", arrowColours, 1, 20, 5, {});
				}
			});

			q.test('check arrows.init() adds the marker svg bit', function() {
				//newsvg = d3.select('#container').append('svg');
				//arrows.init(newsvg, arrowColours);
				q.equal(1, d3.select('#container defs')[0].length);
				q.equal(1, d3.select('#container defs marker')[0].length);
				q.equal(1, d3.select('#container defs marker path')[0].length);
			});

		};
		return {run: run};
	}
);
