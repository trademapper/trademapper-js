require.config({
	baseUrl: '../trademapper/js',
	paths: {
		QUnit: '../../tests/lib/qunit-1.14.0',
		d3: "d3/d3",
		topojson: "d3/topojson.v1"
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
	['QUnit', '../../tests/js/test1'],
	function(QUnit, test1) {
		test1.run();

		QUnit.load();
		QUnit.start();
	}
);
