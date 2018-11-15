define(
	['QUnit', 'trademapper.arrows', 'd3', 'jquery'],
	function(q, arrows, d3, $) {
		"use strict";
		var arrowColours = {
			pathStart: "black",
			pathEnd: "orange"
		},

		run = function() {
			var self = this;

			q.module("Arrows", {
				setup: function() {
					self.newsvg = d3.select('#container').append('svg');
					var tooltip = d3.select('#container').append('div').attr("id", "tooltip-id");
					var svgdefs = self.newsvg.append('defs');
					var zoomg = self.newsvg.append('g');
					// init: function(svgElement, zoomg, svgDefs, tooltipSelector, colours, minWidth, maxWidth, pointTypeSize, countryCodeToInfo) {
					arrows.init(self.newsvg, zoomg, svgdefs, "tooltip-id", arrowColours, 1, 20, 5, {});
				}
			});

			q.test('check arrows.init() adds the marker svg bit', function() {
				var elt = $(self.newsvg.node());
				q.equal($('defs', elt).length, 1);
				q.equal($('defs marker', elt).length, 4);
				q.equal($('defs marker path', elt).length, 4);
			});

		};
		return {run: run};
	}
);
