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

			q.test('check detectColumnType returns year for year-like strings', function() {
				q.equal(customcsv.detectColumnType('1901'), 'year');
				q.equal(customcsv.detectColumnType('1999'), 'year');
				q.equal(customcsv.detectColumnType('2000'), 'year');
				q.equal(customcsv.detectColumnType('2020'), 'year');
			});

			q.test('check detectColumnType returns quantity for non-year-like number-like strings', function() {
				q.equal(customcsv.detectColumnType('19'), 'quantity');
				q.equal(customcsv.detectColumnType('19.99'), 'quantity');
				q.equal(customcsv.detectColumnType('0'), 'quantity');
			});

			q.test('check detectColumnType returns location for 2 letter country codes', function() {
				q.equal(customcsv.detectColumnType('GB'), 'location');
				q.equal(customcsv.detectColumnType('XX'), 'location');
			});

			q.test('check detectColumnType returns text for other text strings', function() {
				q.equal(customcsv.detectColumnType('hello'), 'text');
				q.equal(customcsv.detectColumnType('_'), 'text');
				q.equal(customcsv.detectColumnType('some text goes here!'), 'text');
			});

			q.test('check headerNameToLocationRole when cautious', function() {
				q.equal(customcsv.headerNameToLocationRole('Exporter', true), 'exporter');
				q.equal(customcsv.headerNameToLocationRole('Exp', true), '');
				q.equal(customcsv.headerNameToLocationRole('Destination', true), 'importer');
				q.equal(customcsv.headerNameToLocationRole('Dest', true), '');
				q.equal(customcsv.headerNameToLocationRole('Dst', true), '');
			});

			q.test('check headerNameToLocationRole when not cautious', function() {
				q.equal(customcsv.headerNameToLocationRole('Exporter', false), 'exporter');
				q.equal(customcsv.headerNameToLocationRole('Exp', false), 'exporter');
				q.equal(customcsv.headerNameToLocationRole('Destination', false), 'importer');
				q.equal(customcsv.headerNameToLocationRole('Dest', false), 'importer');
				q.equal(customcsv.headerNameToLocationRole('Dst', false), 'importer');
			});

		};

		return {run: run};
	}
);
