
define(['d3', 'trademapper.route'], function(d3, route) {
	"use strict";
	var fileInputElement,
		csvRoutesLoadedCallback, csvFilterLoadedCallback, errorCallback,

	init = function(fileInput, routeLoadedCallback, filterLoadedCallback, error_callback) {
		fileInputElement = fileInput;
		csvRoutesLoadedCallback = routeLoadedCallback;
		csvFilterLoadedCallback = filterLoadedCallback;
		errorCallback = error_callback;
		if (fileInputElement !== null) {
			fileInputElement.on('change', loadCSVFile);
		}
	},

	setSuccessCallback = function(success_callback) {
		csvRoutesLoadedCallback = success_callback;
	},

	loadCSVFile = function() {
		var file = fileInputElement[0][0].files[0];
		// TODO: replace with output from form element, or even maybe auto discovery ...
		var csvType = "cites";

		if (file.type == 'text/csv' ||
				file.type == 'text/comma-separated-values') {
			var reader = new FileReader();
			reader.onload = function(e) {
				processCSVString(reader.result, csvType);
			};
			reader.readAsText(file);
		} else {
			errorCallback("File needs to be a CSV file");
		}
	},

	/*
	 * make a RouteCollection from a CSV string
	 */
	processCSVString = function(fileText, csvType) {
		var csvData = d3.csv.parse(fileText);
		// do different things for different formats: CITES etc
		processParsedCSV(csvData, csvType);
	},

	processCSVURL = function(url, csvType) {
		d3.csv(url, null, function(csvData) {
			// do different things for different formats: CITES etc
			processParsedCSV(csvData, csvType);
		});
	},

	processParsedCSV = function(csvData, csvType) {
		if (csvProcessors.hasOwnProperty(csvType)) {
			csvProcessors[csvType].routeExtractor(csvType, csvData);
			csvProcessors[csvType].filterExtractor(csvType, csvData);
		} else {
			errorCallback("unknown csvType: " + csvType);
		}
	},

	citesCsvToRoutes = function(csvType, csvData) {
		var routes, points, origin, importer, exporter, importer_quantity,
			exporter_quantity, weight, row,

		// the header of the CITES CSV is:
		// Year,App.,Family,Taxon,Importer,Exporter,Origin,Importer reported quantity,Exporter reported quantity,Term,Unit,Purpose,Source
		IMPORTER_INDEX = "Importer",
		EXPORTER_INDEX = "Exporter",
		ORIGIN_INDEX = "Origin",
		IMPORTER_QUANTITY_INDEX = "Importer reported quantity",
		EXPORTER_QUANTITY_INDEX = "Exporter reported quantity";

		routes = new route.RouteCollection();
		for (var i = 0; i < csvData.length; i++) {
			row = csvData[i];
			origin = row[ORIGIN_INDEX];
			importer = row[IMPORTER_INDEX];
			exporter = row[EXPORTER_INDEX];
			importer_quantity = row[IMPORTER_QUANTITY_INDEX];
			exporter_quantity = row[EXPORTER_QUANTITY_INDEX];
			weight = Math.max(importer_quantity, exporter_quantity);

			// TODO: filter func goes here: if (!filterPass(row)) { continue; }

			points = [];
			if (origin.length == 2 && origin != 'XX') {
				points.push(new route.PointCountry(origin));
			}
			if (exporter.length == 2 && exporter != 'XX') {
				points.push(new route.PointCountry(exporter));
			}
			if (importer.length == 2 && importer != 'XX') {
				points.push(new route.PointCountry(importer));
			}
			routes.addRoute(new route.Route(points, weight));
		}

		// now send back to the callback
		csvRoutesLoadedCallback(csvType, csvData, routes);
	},

	getMinMaxValuesFromCsvColumn = function(csvData, column) {
		var columnNumber,
			min = NaN,
			max = NaN;
		for (var i = 0; i < csvData.length; i++) {
			columnNumber = parseFloat(csvData[i][column]);
			if (!isNaN(columnNumber)) {
				if (isNaN(max)) {
					max = columnNumber;
				} else if (columnNumber > max) {
					max = columnNumber;
				}

				if (isNaN(min)) {
					min = columnNumber;
				} else if (columnNumber < min) {
					min = columnNumber;
				}
			}
		}
		if (isNaN(min)) { min = 0; }
		if (isNaN(max)) { max = min; }
		return [min, max];
	},

	getUniqueValuesFromCsvColumn = function(csvData, column) {
		var unique = {};  // to track what we've already got
		var distinct = [];
		for (var i = 0; i < csvData.length; i++) {
			if (typeof(unique[csvData[i][column]]) === "undefined") {
				distinct.push(csvData[i][column]);
				unique[csvData[i][column]] = 0;
			}
		}
		return distinct;
	},

	csvToFilters = function(csvData, filterSpec) {
		var minmax, filters = {};
		for (var column in filterSpec) {
			if (filterSpec.hasOwnProperty(column)) {
				if (filterSpec[column].type === "ignore") {
					// do nothing
					continue;
				}

				filters[column] = {
					type: filterSpec[column].type
				};
				// TODO: add textmapping? date?
				if (filterSpec[column].type === "text") {
					filters[column].values = getUniqueValuesFromCsvColumn(csvData, column);
				} else if (filterSpec[column].type === "number") {
					minmax = getMinMaxValuesFromCsvColumn(csvData, column);
					filters[column].min = minmax[0];
					filters[column].max = minmax[1];
				} else if (filterSpec[column].type === "location") {
					filters[column].values = getUniqueValuesFromCsvColumn(csvData, column);
				} else if (filterSpec[column].type === "year") {
					minmax = getMinMaxValuesFromCsvColumn(csvData, column);
					filters[column].min = minmax[0];
					filters[column].max = minmax[1];
				} else {
					console.log("Unknown filter column type: " + filterSpec[column].type);
				}
			}
		}
		return filters;
	},

	citesCsvToFilters = function(csvType, csvData) {
		// the header of the CITES CSV is:
		// Year,App.,Family,Taxon,Importer,Exporter,Origin,Importer reported quantity,Exporter reported quantity,Term,Unit,Purpose,Source
		var filterSpec = {
			"Year": {
				type: "year"
			},
			"App.": {
				type: "text"
			},
			"Family": {
				type: "text"
			},
			"Taxon": {
				type: "text"
			},
			"Importer": {
				type: "location"
			},
			"Exporter": {
				type: "location"
			},
			"Origin": {
				type: "location"
			},
			"Importer reported quantity": {
				type: "number"
			},
			"Exporter reported quantity": {
				type: "number"
			},
			"Term": {
				type: "text"
			},
			"Unit": {
				type: "text"
			},
			"Purpose": {
				type: "text"
			},
			"Source": {
				type: "text"
			}
		};

		var filters = csvToFilters(csvData, filterSpec);
		csvFilterLoadedCallback(csvType, csvData, filters);
	},

	csvProcessors = {
		cites: {
			routeExtractor: citesCsvToRoutes,
			filterExtractor: citesCsvToFilters
		}
	};

	return {
		init: init,
		setSuccessCallback: setSuccessCallback,
		processCSVString: processCSVString,
		csvProcessors: csvProcessors
	};
});
