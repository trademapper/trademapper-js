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
					arrows.svg = d3.select('#container').append('svg');
					arrows.arrowColours = arrowColours;
				}
			});

			q.test('check arrows.init() adds the marker svg bit', function() {
				q.equal(1, d3.select('#container defs')[0].length);
				q.equal(1, d3.select('#container defs marker')[0].length);
				q.equal(1, d3.select('#container defs marker path')[0].length);
			});

		};
		return {run: run};
	}
);
