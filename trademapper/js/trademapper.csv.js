
define(['d3', 'trademapper.route'], function(d3, route) {
	"use strict";
	return {
	fileInputElement: null,
	csvDataLoadedCallback: null,
	csvFilterLoadedCallback: null,
	errorCallback: null,
	loadingCsv: false,
	unknownPoints: {},
	csvFile: null,

	init: function(dataLoadedCallback, filterLoadedCallback, error_callback) {
		this.csvDataLoadedCallback = dataLoadedCallback;
		this.csvFilterLoadedCallback = filterLoadedCallback;
		this.errorCallback = error_callback;
	},

	setFileInputElement: function(fileInput) {
		this.fileInputElement = fileInput;
		if (this.fileInputElement !== null) {
			var moduleThis = this;
			this.fileInputElement.on('change', function() {moduleThis.loadCSVFile();});
		}
	},

	setSuccessCallback: function(success_callback) {
		this.csvDataLoadedCallback = success_callback;
	},

	loadCSVFile: function() {
		this.csvFile = this.fileInputElement[0][0].files[0];
		// TODO: replace with output from form element, or even maybe auto discovery ...
		var csvType = "cites";

		var reader = new FileReader();
		var moduleThis = this;
		reader.onload = function(e) {
			moduleThis.loadingCsv = true;
			moduleThis.processCSVString(reader.result, csvType);
			moduleThis.loadingCsv = false;
		};
		reader.readAsText(this.csvFile);
	},

	/*
	 * make a RouteCollection from a CSV string
	 */
	processCSVString: function(fileText, csvType) {
		var csvData = d3.csv.parse(fileText);
		// do different things for different formats: CITES etc
		this.processParsedCSV(csvData, csvType);
	},

	processCSVURL: function(url, csvType) {
		d3.csv(url, null, function(csvData) {
			// do different things for different formats: CITES etc
			this.processParsedCSV(csvData, csvType);
		});
	},

	processParsedCSV: function(csvData, csvType) {
		if (!this.filterSpec.hasOwnProperty(csvType)) {
			errorCallback("unknown csvType: " + csvType);
		}
		var filters = this.csvToFilters(csvData, this.filterSpec[csvType]);
		this.csvFilterLoadedCallback(csvType, csvData, filters);
		this.csvDataLoadedCallback(csvType, csvData);
	},

	filterDataAndReturnRoutes: function(csvType, csvData, filterValues) {
		if (!this.filterSpec.hasOwnProperty(csvType)) {
			errorCallback("unknown csvType: " + csvType);
			return null;
		}
		return this.csvToRoutes(csvData, filterValues, this.filterSpec[csvType]);
	},

	filterPasses: function(row, filterValues) {
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

	extractLocationColumns: function(filterSpec) {
		var locationType, locationColumns = [];
		for (var key in filterSpec) {
			if (filterSpec.hasOwnProperty(key) && filterSpec[key].type === "location") {
				locationType = filterSpec[key].locationType;
				if (locationType === "country_code") {
					locationColumns.push({
						name: key,
						locationType: locationType,
						order: filterSpec[key].locationOrder
					});
				} else {
					// TODO: deal with lat/long
					console.log("unknown locationType: " + locationType);
				}
			}
		}
		locationColumns.sort(function(a, b) { return a.order - b.order; });
		return locationColumns;
	},

	csvToRoutes: function(csvData, filterValues, filterSpec) {
		var points, quantity, row, locationType,
			locationColumns = this.extractLocationColumns(filterSpec),
			routes = new route.RouteCollection();

		// only reset/update the unknownPoints when loading the CSV
		if (this.loadingCsv) { this.unknownPoints = {}; }

		for (var i = 0; i < csvData.length; i++) {
			row = csvData[i];

			// filter out rows that don't match our criteria
			if (!this.filterPasses(row, filterValues)) { continue; }

			// if the quantity is missing for this column, skip this row
			quantity = parseFloat(row[filterValues.quantityColumn.value]);
			if (isNaN(quantity)) {
				continue;
			}

			points = [];
			for (var j = 0; j < locationColumns.length; j++) {
				locationType = locationColumns[j].locationType;
				if (locationType === "country_code") {
					var countryCode = row[locationColumns[j].name];
					if (countryCode.length === 2 && countryCode !== 'XX') {
						var country = new route.PointCountry(countryCode);
						if (country.point === undefined && this.loadingCsv) {
							this.unknownPoints[countryCode] = true;
						}
						points.push(country);
					}
				} else {
					// TODO: deal with lat/long
					console.log("unknown locationType: " + locationType);
				}
			}
			routes.addRoute(new route.Route(points, quantity));
		}

		return routes;
	},

	getMinMaxValuesFromCsvColumn: function(csvData, column) {
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

	getUniqueValuesFromCsvColumn: function(csvData, column) {
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

	csvToFilters: function(csvData, filterSpec) {
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
					filters[column].values = this.getUniqueValuesFromCsvColumn(csvData, column);
				} else if (filterSpec[column].type === "number") {
					minmax = this.getMinMaxValuesFromCsvColumn(csvData, column);
					filters[column].min = minmax[0];
					filters[column].max = minmax[1];
				} else if (filterSpec[column].type === "location") {
					filters[column].values = this.getUniqueValuesFromCsvColumn(csvData, column);
				} else if (filterSpec[column].type === "year") {
					minmax = this.getMinMaxValuesFromCsvColumn(csvData, column);
					filters[column].min = minmax[0];
					filters[column].max = minmax[1];
				} else {
					console.log("Unknown filter column type: " + filterSpec[column].type);
				}
			}
		}
		return filters;
	},

	filterSpec: {
		cites: {
			// the header of the CITES CSV is:
			// Year,App.,Family,Taxon,Importer,Exporter,Origin,Importer reported quantity,Exporter reported quantity,Term,Unit,Purpose,Source
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
				locationOrder: 3,
				locationType: "country_code",
				multiselect: true
			},
			"Exporter": {
				type: "location",
				locationOrder: 2,
				locationType: "country_code",
				multiselect: true
			},
			"Origin": {
				type: "location",
				locationOrder: 1,
				locationType: "country_code",
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
		}
	}

	};
});
