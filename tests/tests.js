require.config({
	baseUrl: '../trademapper/js',
	paths: {
		QUnit: '../../tests/lib/qunit-1.14.0',
		d3: "lib/d3",
		jquery: "lib/jquery-2.1.1.min",
		topojson: "lib/topojson.v1",
		text: "lib/text"
	},
	shim: {
		QUnit: {
			exports: 'QUnit',
			init: function() {
				QUnit.config.autoload = false;
				QUnit.config.autostart = false;
			}
		}
	}
});

require(
	[
		'QUnit',
		'../../tests/js/test-arrows',
		'../../tests/js/test-csv',
		'../../tests/js/test-customcsv',
		'../../tests/js/test-route'
	],
	function(QUnit, test_arrow, test_csv, test_customcsv, test_route) {
		test_arrow.run();
		test_csv.run();
		test_customcsv.run();
		test_route.run();

		QUnit.load();
		QUnit.start();
	}
);
