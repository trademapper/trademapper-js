require.config({
	baseUrl: '../trademapper/js',
	urlArgs: 'cache_bust=' + (new Date()).getTime(),
	paths: {
		QUnit: '../../tests/lib/qunit-1.14.0',
		d3: "lib/d3.min",
		jquery: "lib/jquery-3.3.1.min",
		topojson: "lib/topojson.v3.0.2.min",
		text: "lib/text",
			countrycentre: "map/countrycentre",
			disputedareas: "map/disputedareas",
			worldmap: "map/worldmap"
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
		'../../tests/js/test-route',
		'../../tests/js/test-mapper',
		'../../tests/js/test-portlookup',
	],
	function(QUnit, test_arrow, test_csv, test_customcsv, test_route, test_mapper, test_portlookup) {
		test_arrow.run();
		test_csv.run();
		test_customcsv.run();
		test_route.run();
		test_mapper.run();
		test_portlookup.run();
		QUnit.load();
		QUnit.start();
	}
);
