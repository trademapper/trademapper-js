define(
	['trademapper.arrows', 'd3'],
	function(arrows, d3) {
		var run = function() {
			test('check arrows.init() adds the marker svg bit', function() {
				newsvg = d3.select('#container').append('svg');
				arrows.init(newsvg);
				equal(1, d3.select('#container defs')[0].length);
				equal(1, d3.select('#container defs marker')[0].length);
				equal(1, d3.select('#container defs marker path')[0].length);
			});

		};
		return {run: run};
	}
);
