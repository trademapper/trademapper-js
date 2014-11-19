define(
	['QUnit', 'trademapper.customcsv'],
	function(q, customcsv) {
		"use strict";

		var run = function() {

			q.module("CustomCSV", {
			});

			q.test('check detectColumnType returns ignore for empty string', function() {
				q.equal(customcsv.detectColumnType(''), 'ignore');
				q.equal(customcsv.detectColumnType('  '), 'ignore');
			});


		};

		return {run: run};
	}
);
