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
				q.equal(customcsv.headerNameToLocationRole('garbage', false), '');
				q.equal(customcsv.headerNameToLocationRole('', false), '');
			});

			q.test('check autoCreateFilterSpec copes with only headers', function() {
				// we want to check it doesn't fall over due to lack of data
				var rowData = [['header1', 'header2']];
				q.deepEqual(customcsv.autoCreateFilterSpec(rowData), {
						header1: {
							type: 'ignore',
							shortName: 'header1'
						},
						header2: {
							type: 'ignore',
							shortName: 'header2'
						}
					});
			});

			q.test('check autoCreateFilterSpec finds year column', function() {
				// we want to check it doesn't fall over due to lack of data
				var rowData = [['header1', 'yearCol'], ['', '2003']];
				q.deepEqual(customcsv.autoCreateFilterSpec(rowData), {
						header1: {
							type: 'ignore',
							shortName: 'header1'
						},
						yearCol: {
							type: 'year',
							shortName: 'yearCol'
						}
					});
			});

			q.test('check autoCreateFilterSpec finds year column in 5th row', function() {
				// we want to check it doesn't fall over due to lack of data
				var rowData = [
					['header1', 'yearCol'],
					['', ''],
					['', ''],
					['', ''],
					['', '2003']
				];
				q.deepEqual(customcsv.autoCreateFilterSpec(rowData), {
						header1: {
							type: 'ignore',
							shortName: 'header1'
						},
						yearCol: {
							type: 'year',
							shortName: 'yearCol'
						}
					});
			});

			q.test('check autoCreateFilterSpec finds quantity column', function() {
				// we want to check it doesn't fall over due to lack of data
				var rowData = [
					['header1', 'quantityCol'],
					['', '13,6']
				];
				q.deepEqual(customcsv.autoCreateFilterSpec(rowData), {
						header1: {
							type: 'ignore',
							shortName: 'header1'
						},
						quantityCol: {
							type: 'quantity',
							shortName: 'quantityCol'
						}
					});
			});

			q.test('check autoCreateFilterSpec finds location column from country code', function() {
				// we want to check it doesn't fall over due to lack of data
				var rowData = [
					['header1', 'locationCol'],
					['', 'GB']
				];
				q.deepEqual(customcsv.autoCreateFilterSpec(rowData), {
						header1: {
							type: 'ignore',
							shortName: 'header1'
						},
						locationCol: {
							type: 'location',
							shortName: 'locationCol',
							locationType: 'country_code',
							locationRole: '',
							locationOrder: 5,
							multiSelect: true
						}
					});
			});

			q.test('check autoCreateFilterSpec finds location column from column header', function() {
				// we want to check it doesn't fall over due to lack of data
				var rowData = [
					['header1', 'Exporter'],
					['', '']
				];
				q.deepEqual(customcsv.autoCreateFilterSpec(rowData), {
						header1: {
							type: 'ignore',
							shortName: 'header1'
						},
						Exporter: {
							type: 'location',
							shortName: 'Exporter',
							locationType: 'country_code',
							locationRole: 'exporter',
							locationOrder: 2,
							multiSelect: true
						}
					});
			});

			q.test('check autoCreateFilterSpec finds location and location_extra columns from column headers', function() {
				// we want to check it doesn't fall over due to lack of data
				var rowData = [
					['header1', 'Exporter name', 'Exporter lat.', 'Exporter long.'],
					['', 'A place', '23.3435', '33.2222']
				];
				q.deepEqual(customcsv.autoCreateFilterSpec(rowData), {
						header1: {
							type: 'ignore',
							shortName: 'header1'
						},
						'Exporter name': {
							type: 'location',
							shortName: 'Exporter name',
							locationType: 'country_code',
							locationRole: 'exporter',
							locationOrder: 2,
							multiSelect: true
						},
						'Exporter lat.': {
							type: 'location_extra',
							shortName: 'Exporter lat.',
							locationExtraType: 'latitude',
							locationOrder: 2
						},
						'Exporter long.': {
							type: 'location_extra',
							shortName: 'Exporter long.',
							locationExtraType: 'longitude',
							locationOrder: 2
						}
					});
			});

			q.test('check autoCreateFilterSpec finds text column', function() {
				// we want to check it doesn't fall over due to lack of data
				var rowData = [
					['header1', 'header2'],
					['', 'a type']
				];
				q.deepEqual(customcsv.autoCreateFilterSpec(rowData), {
						header1: {
							type: 'ignore',
							shortName: 'header1'
						},
						header2: {
							type: 'text',
							shortName: 'header2',
							isUnit: false,
							multiSelect: true
						}
					});
			});

			q.test('check autoCreateFilterSpec finds text column with unit', function() {
				// we want to check it doesn't fall over due to lack of data
				var rowData = [
					['header1', 'Unit'],
					['', 'kg']
				];
				q.deepEqual(customcsv.autoCreateFilterSpec(rowData), {
						header1: {
							type: 'ignore',
							shortName: 'header1'
						},
						Unit: {
							type: 'text',
							shortName: 'Unit',
							isUnit: true,
							multiSelect: false
						}
					});
			});

			q.test('check ensureShortNamePresent fills in shortName only when not present', function() {
				var filterSpec = {
					header1: {
						shortName: 'my name'
					},
					header2: {}
				};
				q.deepEqual(customcsv.ensureShortNamePresent(filterSpec), {
					header1: {
						shortName: 'my name'
					},
					header2: {
						shortName: 'header2'
					}
				});
			});

		};

		return {run: run};
	}
);
