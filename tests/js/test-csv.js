define(
	['QUnit', 'trademapper.csv', 'trademapper.csv.definition', 'trademapper.route'],
	function(q, csv, csvdefs, route) {
		"use strict";
		var returnedCsv,
			setReturnedCsv = function(csvData, csvFirstTenRows, filterSpec) {
				returnedCsv = csvData;
			},
			returnedFilters,
			setReturnedFilters = function(csvData, filterSpec, filters) {
				returnedFilters = filters;
			},
			errorMessageList,
			setErrorMessage = function() {
				errorMessageList = csv.loadErrorsToStrings();
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
					csv.init(setReturnedCsv, setReturnedFilters, setErrorMessage, false);
					// we also need to be able to create points
					route.setCountryGetPointFunc(function() { return [8, 9]; });
					route.setLatLongToPointFunc(function(latlong) { return latlong; });
				}
			});

			q.test('check csv parsing for one line CSV without origin', function() {
				returnedCsv = null;
				errorMessageList = null;
				csv.processCSVString(csvOneLine);

				q.equal(errorMessageList, null);
				q.notEqual(returnedCsv, null);
				var routes = csv.filterDataAndReturnRoutes(
					returnedCsv, csvdefs.filterSpec.cites, initialFilterValue);
				var routeList = routes.getRoutes();
				q.equal(routeList.length, 1);
				q.equal(routeList[0].points.length, 2);
				q.equal(routeList[0].points[0].countryCode, "ZW");
				q.equal(routeList[0].points[1].countryCode, "AE");
			});

			q.test('check csv parsing for one line CSV with origin', function() {
				returnedCsv = null;
				errorMessageList = null;
				csv.processCSVString(csvOneLine3Points);

				q.equal(errorMessageList, null);
				q.notEqual(returnedCsv, null);
				var routes = csv.filterDataAndReturnRoutes(
					returnedCsv, csvdefs.filterSpec.cites, initialFilterValue);
				var routeList = routes.getRoutes();
				q.equal(routeList.length, 1);
				q.equal(routeList[0].points.length, 3);
				q.equal(routeList[0].points[0].countryCode, "BW");
				q.equal(routeList[0].points[1].countryCode, "ZA");
				q.equal(routeList[0].points[2].countryCode, "AT");
			});

			q.test('check csv parsing for multiline CSV', function() {
				returnedCsv = null;
				errorMessageList = null;
				csv.processCSVString(csvEightLine);

				q.equal(errorMessageList, null);
				q.notEqual(returnedCsv, null);
				var routes = csv.filterDataAndReturnRoutes(
					returnedCsv, csvdefs.filterSpec.cites, initialFilterValue);
				var routeList = routes.getRoutes();
				// There are 3 duplicates which will be combined
				q.equal(routeList.length, 5);
			});

			q.test('check csv filter extraction for multiline CSV', function() {
				returnedFilters = null;
				errorMessageList = null;
				csv.processCSVString(csvEightLine);

				q.equal(errorMessageList, null);
				q.notEqual(returnedFilters, null);
				q.deepEqual(returnedFilters,
					{
						"Quantity": {
							type: "quantity",
							values: ["Importer reported quantity", "Exporter reported quantity"]
						},
						"Year": {
							multiValueColumn: false,
							type: "year",
							min: 2003,
							max: 2003
						},
						"App.": {
							multiValueColumn: false,
							multiselect: true,
							type: "text",
							values: ["II"]
						},
						"Family": {
							multiValueColumn: false,
							multiselect: true,
							type: "text",
							values: ["Elephantidae"]
						},
						"Taxon": {
							multiValueColumn: false,
							multiselect: true,
							type: "text",
							values: ["Loxodonta africana"]
						},
						"Importer": {
							multiValueColumn: false,
							multiselect: true,
							type: "location",
							locationType: "country_code",
							locationOrder: 3,
							locationRole: "importer",
							values: ["AE", "AR", "AT"]
						},
						"Exporter": {
							multiValueColumn: false,
							multiselect: true,
							type: "location",
							locationType: "country_code",
							locationOrder: 2,
							locationRole: "exporter",
							values: ["BW", "NA", "ZA", "ZW"]
						},
						"Origin": {
							multiValueColumn: false,
							multiselect: true,
							type: "location",
							locationType: "country_code",
							locationOrder: 1,
							locationRole: "origin",
							values: ["", "BW"]
						},
						"Term": {
							multiValueColumn: false,
							multiselect: true,
							type: "text",
							values: ["ivory carvings", "tusks"]
						},
						"Unit": {
							multiValueColumn: false,
							multiselect: false,
							type: "text",
							isUnit: true,
							values: [""]
						},
						"Purpose": {
							multiValueColumn: false,
							multiselect: true,
							type: "text",
							values: ["H", "P", "T"],
							verboseNames: {
								"B": "Captive breeding / artificial propagation",
								"E": "Educational",
								"G": "Botanical garden",
								"H": "Hunting trophy",
								"L": "Law enforcement / judicial / forensic",
								"M": "Medical (including biomedical research)",
								"N": "Reintroduction / introduction into wild",
								"P": "Personal",
								"Q": "Circus or travelling exhibition",
								"S": "Scientific",
								"T": "Commercial",
								"Z": "Zoo"
							}
						},
						"Source": {
							multiValueColumn: false,
							multiselect: true,
							type: "text",
							values: ["W"]
						}
					});
			});

			q.test('check autodetectCsvType matches exact text', function() {
				csvdefs.csvHeaderToType["exact,text,match"] = "test-exact";
				q.equal(csv.autodetectCsvType("exact,text,match"), "test-exact");
			});

			q.test('check autodetectCsvType matches text with spaces', function() {
				csvdefs.csvHeaderToType["text,match,withspaces"] = "test-space";
				q.equal(csv.autodetectCsvType("text, match, with spaces"), "test-space");
			});

			q.test('check autodetectCsvType matches text with upper case', function() {
				csvdefs.csvHeaderToType["text,match,withuppercase"] = "test-uppercase";
				q.equal(csv.autodetectCsvType("text,match,with Upper Case"), "test-uppercase");
			});

			q.test('check autodetectCsvType matches text with hyphens', function() {
				csvdefs.csvHeaderToType["text,match,withhyphens"] = "test-hyphen";
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

			q.test('check getUniqueCommaSeparatedValuesFromCsvColumn', function() {
				var csvData = [
					{"column": "b"},
					{"column": "a"},
					{"column": "a,b"},
					{"column": "a,b"},
					{"column": "b , a"},
					{"column": ""},
					{"column": "a"},
				];
				q.deepEqual(csv.getUniqueCommaSeparatedValuesFromCsvColumn(csvData, "column"), ["", "a", "b"]);
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

			q.test('check getPointsFromRow does country_code ok', function() {
				var row = {start: "EG", middle: "", end: "GB"},
					locationColumns = [
						{locationType: "country_code", name: "start"},
						{locationType: "country_code", name: "middle"},
						{locationType: "country_code", name: "end"}
					];
				var points = csv.getPointsFromRow(row, locationColumns);
				q.equal(points.length, 2);
				q.equal(points[0].toString(), "EG");
				q.equal(points[1].toString(), "GB");
			});

			q.test('check getPointsFromRow does country_code_list ok', function() {
				var row = {start: "EG, IT", middle: "", end: "GB"},
					locationColumns = [
						{locationType: "country_code_list", name: "start"},
						{locationType: "country_code_list", name: "middle"},
						{locationType: "country_code_list", name: "end"}
					];
				var points = csv.getPointsFromRow(row, locationColumns);
				q.equal(points.length, 3);
				q.equal(points[0].toString(), "EG");
				q.equal(points[1].toString(), "IT");
				q.equal(points[2].toString(), "GB");
			});

			q.test('check getPointsFromRow does latlong ok', function() {
				var row = {
						start: "savannah",
						start_lat: "1.23",
						start_long: "2.34",
						middle: "warehouse",
						middle_lat: "3.45",
						middle_long: "4.56",
						end: "medicine man",
						end_lat: "5.67",
						end_long: "6.78"
					},
					locationColumns = [
						{locationType: "latlong", name: "start", latitude: "start_lat", longitude: "start_long"},
						{locationType: "latlong", name: "middle", latitude: "middle_lat", longitude: "middle_long"},
						{locationType: "latlong", name: "end", latitude: "end_lat", longitude: "end_long"}
					];

			var points = csv.getPointsFromRow(row, locationColumns);

			q.equal(points.length, 3);
			q.equal(points[0].toString(), "savannah");
			q.deepEqual(points[0].latlong, [2.34, 1.23]);
			q.equal(points[1].toString(), "warehouse");
			q.deepEqual(points[1].latlong, [4.56, 3.45]);
			q.equal(points[2].toString(), "medicine man");
			q.deepEqual(points[2].latlong, [6.78, 5.67]);
			});

			q.test('check extractLocationColumns gets country_code columns', function() {
				var filterSpec = {
					col1: {
						type: "location",
						locationOrder: 1,
						locationRole: "origin",
						locationType: "country_code"
					},
					col2: {
						type: "location",
						locationOrder: 2,
						locationRole: "exporter",
						locationType: "country_code_list"
					},
					col3: {
						type: "ignore",
						locationOrder: 3,
						locationRole: "importer",
						locationType: "country_code"
					}
				};

				var columns = csv.extractLocationColumns(filterSpec);

				q.deepEqual(columns, [
					{
						name: "col1",
						locationType: "country_code",
						locationRole: "origin",
						order: 1
					},
					{
						name: "col2",
						locationType: "country_code_list",
						locationRole: "exporter",
						order: 2
					}
				]);
			});

			q.test('check extractLocationColumns gets latlong columns', function() {
				var filterSpec = {
					col1name: {
						type: "location",
						locationOrder: 1,
						locationRole: "origin",
						locationType: "latLongName"
					},
					col1lat: {
						type: "location",
						locationOrder: 1,
						locationType: "latitude"
					},
					col1long: {
						type: "location",
						locationOrder: 1,
						locationType: "longitude"
					},
					col2name: {
						type: "location",
						locationOrder: 2,
						locationRole: "exporter",
						locationType: "latLongName"
					},
					col2lat: {
						type: "location",
						locationOrder: 2,
						locationType: "latitude"
					},
					col2long: {
						type: "location",
						locationOrder: 2,
						locationType: "longitude"
					},
					col3: {
						type: "ignore",
						locationOrder: 3,
						locationRole: "importer",
						locationType: "country_code"
					}
				};

				var columns = csv.extractLocationColumns(filterSpec);

				q.deepEqual(columns, [
					{
						name: "col1name",
						locationType: "latlong",
						locationRole: "origin",
						latitude: "col1lat",
						longitude: "col1long",
						order: 1
					},
					{
						name: "col2name",
						locationType: "latlong",
						locationRole: "exporter",
						latitude: "col2lat",
						longitude: "col2long",
						order: 2
					}
				]);
			});

			q.test('check trimCsvColumnNames does not alter good csv', function() {
				var csvString = "x x,y,z\n1,2",
					newCsvString = csv.trimCsvColumnNames(csvString);

				q.equal(newCsvString, csvString);
			});

			q.test('check trimCsvColumnNames trims spaces from column names', function() {
				var csvString = "x x , y ,z\n1,2",
					newCsvString = csv.trimCsvColumnNames(csvString);

				q.equal(newCsvString, "x x,y,z\n1,2");
			});

			q.test('check trimCsvColumnNames trims spaces from quoted column names', function() {
				var csvString = '"x,and x "," y ","z"\n1,2',
					newCsvString = csv.trimCsvColumnNames(csvString);

				q.equal(newCsvString, '"x,and x","y","z"\n1,2');
			});

			q.test('check getMinMaxYear finds min and max year from type year', function() {
				var testFilters = {
					filter1: {
						type: "text"
					},
					filter2: {
						type: "quantity",
						min: 23,
						max: 26
					},
					filter3: {
						type: "year",
						min: 2003,
						max: 2006
					}
				};

				var minMax = csv.getMinMaxYear(testFilters);
				q.equal(minMax[0], 2003);
				q.equal(minMax[1], 2006);
			});

			// TODO: tests for:
			// * filterPasses()
			// * csvToFilters()
			// * csvToRoutes()

		};

		return {run: run};
	}
);
