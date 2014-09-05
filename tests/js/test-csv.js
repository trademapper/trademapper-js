define(
	['QUnit', 'trademapper.csv', 'trademapper.route'],
	function(q, csv, route) {
		"use strict";
		var returnedCsv,
			setReturnedCsv = function(csvType, csvData) {
				returnedCsv = csvData;
			},
			returnedFilters,
			setReturnedFilters = function(csvType, csvData, filters) {
				returnedFilters = filters;
			},
			errorMessage,
			setErrorMessage = function(message) {
				errorMessage = message;
			},
			initialFilterValue = {quantityColumn: {value: "Exporter reported quantity"}},
			csvUnknown = "Year,Species,Start,End\n2010,Unicorn,Narnia,Atlantis",
			csvHeader = "Year,App.,Family,Taxon,Importer,Exporter,Origin," +
				"Importer reported quantity,Exporter reported quantity," +
				"Term,Unit,Purpose,Source\n",
			csvMinimal = csvHeader + ",,,,,,,,,,,,",
			csvOneLine = csvHeader +
				"2003,II,Elephantidae,Loxodonta africana,AE,ZW,,,2,tusks,,T,W",
			csvOneLine3Points = csvHeader +
				"2003,II,Elephantidae,Loxodonta africana,AT,ZA,BW,,2,tusks,,H,W",
			csvEightLine = csvHeader +
				"2003,II,Elephantidae,Loxodonta africana,AE,ZW,,,2,tusks,,T,W\n" +
				"2003,II,Elephantidae,Loxodonta africana,AR,BW,,,2,tusks,,H,W\n" +
				"2003,II,Elephantidae,Loxodonta africana,AR,ZW,,,1,ivory carvings,,T,W\n" +
				"2003,II,Elephantidae,Loxodonta africana,AT,NA,,,10,tusks,,H,W\n" +
				"2003,II,Elephantidae,Loxodonta africana,AT,NA,,6,,tusks,,P,W\n" +
				"2003,II,Elephantidae,Loxodonta africana,AT,NA,,6,,tusks,,T,W\n" +
				"2003,II,Elephantidae,Loxodonta africana,AT,ZA,BW,,2,tusks,,H,W";

		var run = function() {

			q.module("CSV", {
				setup: function() {
					// set a default function for collecting the returned routes
					csv.init(setReturnedCsv, setReturnedFilters, setErrorMessage);
					// we also need to be able to create points
					route.setCountryGetPointFunc(function() { return [8, 9]; });
				}
			});

			q.test('check error message for unknown csv type', function() {
				returnedCsv = null;
				errorMessage = null;
				csv.processCSVString(csvUnknown);
				var routes = csv.filterDataAndReturnRoutes("unknown", returnedCsv, {});

				q.equal(routes, null);
				q.notEqual(errorMessage, null);
			});

			q.test('check csv parsing for one line CSV without origin', function() {
				returnedCsv = null;
				errorMessage = null;
				csv.processCSVString(csvOneLine);

				q.equal(errorMessage, null);
				q.notEqual(returnedCsv, null);
				var routes = csv.filterDataAndReturnRoutes("cites", returnedCsv, initialFilterValue);
				var routeList = routes.getRoutes();
				q.equal(routeList.length, 1);
				q.equal(routeList[0].points.length, 2);
				q.equal(routeList[0].points[0].countryCode, "ZW");
				q.equal(routeList[0].points[1].countryCode, "AE");
			});

			q.test('check csv parsing for one line CSV with origin', function() {
				returnedCsv = null;
				errorMessage = null;
				csv.processCSVString(csvOneLine3Points);

				q.equal(errorMessage, null);
				q.notEqual(returnedCsv, null);
				var routes = csv.filterDataAndReturnRoutes("cites", returnedCsv, initialFilterValue);
				var routeList = routes.getRoutes();
				q.equal(routeList.length, 1);
				q.equal(routeList[0].points.length, 3);
				q.equal(routeList[0].points[0].countryCode, "BW");
				q.equal(routeList[0].points[1].countryCode, "ZA");
				q.equal(routeList[0].points[2].countryCode, "AT");
			});

			q.test('check csv parsing for multiline CSV', function() {
				returnedCsv = null;
				errorMessage = null;
				csv.processCSVString(csvEightLine);

				q.equal(errorMessage, null);
				q.notEqual(returnedCsv, null);
				var routes = csv.filterDataAndReturnRoutes("cites", returnedCsv, initialFilterValue);
				var routeList = routes.getRoutes();
				// There are 3 duplicates which will be combined
				q.equal(routeList.length, 5);
			});

			q.test('check csv filter extraction for multiline CSV', function() {
				returnedFilters = null;
				errorMessage = null;
				csv.processCSVString(csvEightLine);

				q.equal(errorMessage, null);
				q.notEqual(returnedFilters, null);
				q.deepEqual(returnedFilters,
					{
						"Quantity": {
							type: "quantity",
							values: ["Importer reported quantity", "Exporter reported quantity"]
						},
						"Year": {
							type: "year",
							min: 2003,
							max: 2003
						},
						"App.": {
							multiselect: true,
							type: "text",
							values: ["II"]
						},
						"Family": {
							multiselect: true,
							type: "text",
							values: ["Elephantidae"]
						},
						"Taxon": {
							multiselect: true,
							type: "text",
							values: ["Loxodonta africana"]
						},
						"Importer": {
							multiselect: true,
							type: "location",
							values: ["AE", "AR", "AT"]
						},
						"Exporter": {
							multiselect: true,
							type: "location",
							values: ["BW", "NA", "ZA", "ZW"]
						},
						"Origin": {
							multiselect: true,
							type: "location",
							values: ["", "BW"]
						},
						"Term": {
							multiselect: true,
							type: "text",
							values: ["ivory carvings", "tusks"]
						},
						"Unit": {
							multiselect: false,
							type: "text",
							values: [""]
						},
						"Purpose": {
							multiselect: true,
							type: "text",
							values: ["H", "P", "T"]
						},
						"Source": {
							multiselect: true,
							type: "text",
							values: ["W"]
						}
					});
			});

			q.test('check autodetectCsvType matches exact text', function() {
				csv.csvHeaderToType["exact,text,match"] = "test-exact";
				q.equal(csv.autodetectCsvType("exact,text,match"), "test-exact");
			});

			q.test('check autodetectCsvType matches text with spaces', function() {
				csv.csvHeaderToType["text,match,withspaces"] = "test-space";
				q.equal(csv.autodetectCsvType("text, match, with spaces"), "test-space");
			});

			q.test('check autodetectCsvType matches text with upper case', function() {
				csv.csvHeaderToType["text,match,withuppercase"] = "test-uppercase";
				q.equal(csv.autodetectCsvType("text,match,with Upper Case"), "test-uppercase");
			});

			q.test('check autodetectCsvType matches text with hyphens', function() {
				csv.csvHeaderToType["text,match,withhyphens"] = "test-hyphen";
				q.equal(csv.autodetectCsvType("text,match,with-hyphens"), "test-hyphen");
			});

			q.test('check getUniqueValuesFromCsvColumn', function() {
				var csvData = [
					{"column": "b"},
					{"column": "a"},
					{"column": "a "},
					{"column": "b"},
					{"column": ""},
					{"column": "a"},
				];
				q.deepEqual(csv.getUniqueValuesFromCsvColumn(csvData, "column"), ["", "a", "b"]);
			});

			q.test('check getMinMaxValuesFromCsvColumn deals with numbers', function() {
				var csvData = [
					{"column": "1"},
					{"column": "3.3"},
					{"column": "2.3 "},
					{"column": "-1"},
					{"column": "0"},
				];
				q.deepEqual(csv.getMinMaxValuesFromCsvColumn(csvData, "column"), [-1, 3.3]);
			});

			q.test('check getMinMaxValuesFromCsvColumn deals with no rows', function() {
				var csvData = [];
				q.deepEqual(csv.getMinMaxValuesFromCsvColumn(csvData, "column"), [0, 0]);
			});

			q.test('check getMinMaxValuesFromCsvColumn deals with one blank row', function() {
				var csvData = [ {"column": ""} ];
				q.deepEqual(csv.getMinMaxValuesFromCsvColumn(csvData, "column"), [0, 0]);
			});

			q.test('check getMinMaxValuesFromCsvColumn deals with one numeric row', function() {
				var csvData = [ {"column": "3"} ];
				q.deepEqual(csv.getMinMaxValuesFromCsvColumn(csvData, "column"), [3, 3]);
			});

		};
		return {run: run};
	}
);
