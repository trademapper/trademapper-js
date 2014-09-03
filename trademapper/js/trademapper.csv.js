
define(['d3', 'trademapper.route'], function(d3, route) {
	"use strict";
	var fileInputElement,
		csvDataLoadedCallback, csvFilterLoadedCallback, errorCallback,

	init = function(dataLoadedCallback, filterLoadedCallback, error_callback) {
		csvDataLoadedCallback = dataLoadedCallback;
		csvFilterLoadedCallback = filterLoadedCallback;
		errorCallback = error_callback;
	},

	setFileInputElement = function(fileInput) {
		fileInputElement = fileInput;
		if (fileInputElement !== null) {
			fileInputElement.on('change', loadCSVFile);
		}
	},

	setSuccessCallback = function(success_callback) {
		csvDataLoadedCallback = success_callback;
	},

	loadCSVFile = function() {
		var file = fileInputElement[0][0].files[0];
		// TODO: replace with output from form element, or even maybe auto discovery ...
		var csvType = "cites";

		var reader = new FileReader();
		reader.onload = function(e) {
			processCSVString(reader.result, csvType);
		};
		reader.readAsText(file);
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
			csvProcessors[csvType].filterExtractor(csvType, csvData);
		} else {
			errorCallback("unknown csvType: " + csvType);
		}
		// now send back to the callback
		csvDataLoadedCallback(csvType, csvData);
	},

	filterDataAndReturnRoutes = function(csvType, csvData, filterValues) {
		if (csvProcessors.hasOwnProperty(csvType)) {
			return csvProcessors[csvType].routeExtractor(csvType, csvData, filterValues);
		} else {
			errorCallback("unknown csvType: " + csvType);
			return null;
		}
	},

	filterPasses = function(row, filterValues) {
		var filter, filterName;
		for (filterName in filterValues) {
			if (filterValues.hasOwnProperty(filterName)) {
				filter = filterValues[filterName];

				if (filterName === "quantityColumn") {
					// do nothing - don't filter on this column
				}
				else if (filter.type === "category-single") {
					// if any value is allowed, skip this filter
					if (filter.any === false && row[filterName] != filter.value) {
						return false;
					}
				} else if (filter.type === "category-multi") {
					// if any value is allowed, skip this filter
					if (filter.any === false && filter.valueList.indexOf(row[filterName]) === -1) {
						return false;
					}
				} else if (filter.type === "year") {
					if (row[filterName] < filter.minValue || row[filterName] > filter.maxValue) {
						return false;
					}
				} else if (filter.type === "numeric") {
					// TODO:
				}

			}
		}
		return true;
	},

	citesCsvToRoutes = function(csvType, csvData, filterValues) {
		var routes, points, origin, importer, exporter, importer_quantity,
			exporter_quantity, quantity, row,

		// the header of the CITES CSV is:
		// Year,App.,Family,Taxon,Importer,Exporter,Origin,Importer reported quantity,Exporter reported quantity,Term,Unit,Purpose,Source
		IMPORTER_INDEX = "Importer",
		EXPORTER_INDEX = "Exporter",
		ORIGIN_INDEX = "Origin";

		routes = new route.RouteCollection();
		for (var i = 0; i < csvData.length; i++) {
			row = csvData[i];

			// filter out rows that don't match our criteria
			if (!filterPasses(row, filterValues)) { continue; }

			origin = row[ORIGIN_INDEX];
			importer = row[IMPORTER_INDEX];
			exporter = row[EXPORTER_INDEX];

			// if the quantity is missing for this column, skip this row
			quantity = parseFloat(row[filterValues.quantityColumn.value]);
			if (isNaN(quantity)) {
				continue;
			}

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
			routes.addRoute(new route.Route(points, quantity));
		}

		return routes;
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
		var minmax, filters = {Quantity: {type: "quantity", values: []}};
		for (var column in filterSpec) {
			if (filterSpec.hasOwnProperty(column)) {
				if (filterSpec[column].type === "ignore") {
					// do nothing
					continue;
				}

				if (filterSpec[column].type === "quantity") {
					// quantity columns just get added to a list
					filters.Quantity.values.push(column);
					continue;
				}

				filters[column] = {
					type: filterSpec[column].type
				};
				if (filterSpec[column].hasOwnProperty("multiselect")) {
					filters[column].multiselect = filterSpec[column].multiselect;
				}
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
				type: "text",
				multiselect: true
			},
			"Family": {
				type: "text",
				multiselect: true
			},
			"Taxon": {
				type: "text",
				multiselect: true
			},
			"Importer": {
				type: "location",
				multiselect: true
			},
			"Exporter": {
				type: "location",
				multiselect: true
			},
			"Origin": {
				type: "location",
				multiselect: true
			},
			"Importer reported quantity": {
				type: "quantity"
			},
			"Exporter reported quantity": {
				type: "quantity"
			},
			"Term": {
				type: "text",
				multiselect: true
			},
			"Unit": {
				type: "text",
				multiselect: false  // doesn't make sense to have multiselect
			},
			"Purpose": {
				type: "text",
				multiselect: true
			},
			"Source": {
				type: "text",
				multiselect: true
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
		setFileInputElement: setFileInputElement,
		processCSVString: processCSVString,
		filterDataAndReturnRoutes: filterDataAndReturnRoutes,
		csvToFilters: csvToFilters,
		csvProcessors: csvProcessors
	};
});
