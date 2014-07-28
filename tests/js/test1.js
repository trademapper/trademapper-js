define(
	['trademapper.arrows', 'trademapper.route', 'd3'],
	function(arrows, route, d3) {
		var run = function() {
			test('check PointLatLong sets point using latLongToPointFunc', function() {
				route.setLatLongToPointFunc(function() { return [3, 4]; });
				var point = new route.PointLatLong(5, 6);
				equal(5, point.latlong[0], 'The x of latlong should be 5');
				equal(6, point.latlong[1], 'The y of latlong should be 6');
				equal(3, point.point[0], 'The x of point should be 3');
				equal(4, point.point[1], 'The y of point should be 4');
			});

			test('check PointCountry sets point using countryGetPointFunc', function() {
				route.setCountryGetPointFunc(function() { return [8, 9]; });
				var point = new route.PointCountry("GB");
				equal("GB", point.countryCode, 'The countryCode should be "GB"');
				equal(8, point.point[0], 'The x of point should be 8');
				equal(9, point.point[1], 'The y of point should be 9');
			});

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
