define(
	['trademapper.arrows', 'trademapper.route'],
	function(arrows, route) {
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

			test('silly', function() {
				equal(1+1, 2, 'The return should be 2');
			});
		};
		return {run: run};
	}
);
