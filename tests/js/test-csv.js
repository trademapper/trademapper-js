define(
	['QUnit', 'trademapper.csv', 'trademapper.route'],
	function(q, csv, route) {
		"use strict";
		var returnedRoutes,
			setReturnedRoutes = function(routes) {
				returnedRoutes = routes;
			},
			errorMessage,
			setErrorMessage = function(message) {
				errorMessage = message;
			},
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
					csv.init(null, setReturnedRoutes, setErrorMessage);
					// we also need to be able to create points
					route.setCountryGetPointFunc(function() { return [8, 9]; });
				}
			});

			q.test('check error message for unknown csv type', function() {
				returnedRoutes = null;
				errorMessage = null;
				csv.processCSVString(csvMinimal, "unknown");

				q.equal(returnedRoutes, null);
				q.notEqual(errorMessage, null);
			});

			q.test('check csv parsing for one line CSV without origin', function() {
				returnedRoutes = null;
				errorMessage = null;
				csv.processCSVString(csvOneLine, "cites");

				q.equal(errorMessage, null);
				q.notEqual(returnedRoutes, null);
				var routeList = returnedRoutes.getRoutes();
				q.equal(routeList.length, 1);
				q.equal(routeList[0].points.length, 2);
				q.equal(routeList[0].points[0].countryCode, "ZW");
				q.equal(routeList[0].points[1].countryCode, "AE");
			});

			q.test('check csv parsing for one line CSV with origin', function() {
				returnedRoutes = null;
				errorMessage = null;
				csv.processCSVString(csvOneLine3Points, "cites");

				q.equal(errorMessage, null);
				q.notEqual(returnedRoutes, null);
				var routeList = returnedRoutes.getRoutes();
				q.equal(routeList.length, 1);
				q.equal(routeList[0].points.length, 3);
				q.equal(routeList[0].points[0].countryCode, "BW");
				q.equal(routeList[0].points[1].countryCode, "ZA");
				q.equal(routeList[0].points[2].countryCode, "AT");
			});

			q.test('check csv parsing for multiline CSV', function() {
				returnedRoutes = null;
				errorMessage = null;
				csv.processCSVString(csvEightLine, "cites");

				q.equal(errorMessage, null);
				q.notEqual(returnedRoutes, null);
				var routeList = returnedRoutes.getRoutes();
				// There are 3 duplicates which will be combined
				q.equal(routeList.length, 5);
			});

		};
		return {run: run};
	}
);
