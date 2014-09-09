
define(['trademapper.csv.definition', 'trademapper.route', 'util', 'd3'], function(csvdefs, route, util, d3) {
	"use strict";
	return {
	fileInputElement: null,
	csvDataLoadedCallback: null,
	csvFilterLoadedCallback: null,
	errorCallback: null,
	loadingCsv: false,
	loadErrors: null,
	csvFile: null,

	init: function(dataLoadedCallback, filterLoadedCallback, error_callback) {
		this.csvDataLoadedCallback = dataLoadedCallback;
		this.csvFilterLoadedCallback = filterLoadedCallback;
		this.errorCallback = error_callback;
		this.resetLoadErrors();
	},

	resetLoadErrors: function() {
		this.loadErrors = {
			unknownCSVFormat: [],
			unknownCountries: {}
		};
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
		this.resetLoadErrors();
		this.csvFile = this.fileInputElement[0][0].files[0];

		var reader = new FileReader();
		var moduleThis = this;

		reader.onload = function(e) {
			moduleThis.loadingCsv = true;
			moduleThis.processCSVString(reader.result);
			moduleThis.loadingCsv = false;
		};
		reader.readAsText(this.csvFile);
	},

	loadErrorsToStrings: function() {
		var errorMsgs = [],
			unknownCountries = Object.keys(this.loadErrors.unknownCountries);
		errorMsgs = errorMsgs.concat(this.loadErrors.unknownCSVFormat);
		if (unknownCountries.length > 0) {
			unknownCountries.sort();
			errorMsgs.push("Unknown country codes: " + unknownCountries.join(", "));
		}
		return errorMsgs;
	},

	autodetectCsvType: function(firstLine) {
		// get the first line, lower case, and remove spaces
		firstLine = firstLine.toLowerCase().replace(/[^\w,]/g, '');

		if (csvdefs.csvHeaderToType.hasOwnProperty(firstLine)) {
			return csvdefs.csvHeaderToType[firstLine];
		}
		// etis might not have all columns - let's hope the reference
		// number has made it in
		if (firstLine.indexOf("etisidno") !== -1) {
			return "etis";
		}
	},

	trimCsvColumnNames: function(csvString) {
		// TODO: what if a column name includes \n ?!?!
		// split on commas - but use d3 for proper parsing
		var i,
			csvHeaderLine = csvString.substring(0, csvString.indexOf("\n")),
			csvHeaders = d3.csv.parseRows(csvHeaderLine)[0],
			quotesPresent = csvHeaderLine.indexOf('"') !== -1,
			newCsvHeaders = [];

		for (i = 0; i < csvHeaders.length; i++) {
			var header = csvHeaders[i];

			// trim whitespace
			header = header.trim();

			newCsvHeaders.push(header);
		}
		// put quotes back if they were there
		if (quotesPresent) {
			for (i = 0; i < newCsvHeaders.length; i++) {
				newCsvHeaders[i] = '"' + newCsvHeaders[i] + '"';
			}
		}

		// replace original csv header string
		var csvWithoutHeaders = csvString.slice(csvString.indexOf("\n"));
		var newCsvHeader = newCsvHeaders.join(",");
		csvString = newCsvHeader + csvWithoutHeaders;

		return csvString;
	},

	/*
	 * make a RouteCollection from a CSV string
	 */
	processCSVString: function(fileText) {
		var firstLine = fileText.substring(0, fileText.indexOf("\n"));
		var csvType = this.autodetectCsvType(firstLine);
		if (csvType) {
			fileText = this.trimCsvColumnNames(fileText);
			var csvData = d3.csv.parse(fileText);
			this.processParsedCSV(csvData, csvType);
		} else {
			this.loadErrors.unknownCSVFormat.push("unknown CSV header: " + firstLine);
			this.errorCallback();
		}
	},

	processCSVURL: function(url, csvType) {
		// TODO: work out csvType from csvData???
		this.loadingCsv = true;
		var moduleThis = this;
		d3.csv(url, null, function(csvData, csvType) {
			moduleThis.processParsedCSV(csvData);
		});
		this.loadingCsv = false;
	},

	processParsedCSV: function(csvData, csvType) {
		if (!csvdefs.filterSpec.hasOwnProperty(csvType)) {
			this.loadErrors.unknownCSVFormat.push("no filter spec for csv type: " + csvType);
			this.errorCallback();
		}
		var filters = this.csvToFilters(csvData, csvdefs.filterSpec[csvType]);
		this.csvFilterLoadedCallback(csvType, csvData, filters);
		this.csvDataLoadedCallback(csvType, csvData);
	},

	filterDataAndReturnRoutes: function(csvType, csvData, filterValues) {
		if (!csvdefs.filterSpec.hasOwnProperty(csvType)) {
			this.loadErrors.unknownCSVFormat.push("no filter spec for csv type: " + csvType);
			this.errorCallback();
			return null;
		}
		return this.csvToRoutes(csvData, filterValues, csvdefs.filterSpec[csvType]);
	},

	filterPasses: function(row, filterValues) {
		var filter, filterName, rowValue, rowValueList;
		for (filterName in filterValues) {
			if (filterValues.hasOwnProperty(filterName)) {
				filter = filterValues[filterName];

				if (filterName === "quantityColumn") {
					// do nothing - don't filter on this column
				}
				else if (filter.type === "category-single") {
					rowValue = row[filterName].trim();
					// if any value is allowed, skip this filter
					if (filter.any === false && rowValue != filter.value) {
						return false;
					}
				} else if (filter.type === "category-multi") {
					rowValue = row[filterName].trim();
					// if any value is allowed, skip this filter
					if (filter.any === false) {
						if (filter.multiValueColumn) {
							rowValueList = rowValue.split(",").map(function(s) { return s.trim(); });
							if (util.intersection(filter.valueList, rowValueList).length === 0) {
								return false;
							}
						} else {
							if (filter.valueList.indexOf(rowValue) === -1) {
								return false;
							}
						}
					}
				} else if (filter.type === "year") {
					rowValue = parseInt(row[filterName]);
					if (rowValue < filter.minValue || rowValue > filter.maxValue) {
						return false;
					}
				} else if (filter.type === "numeric") {
					// TODO: the filter form end of this
					rowValue = parseFloat(row[filterName]);
					if (rowValue < filter.minValue) {
						return false;
					}
				}

			}
		}
		return true;
	},

	getOrCreateLatLongLocationColumn: function(locationColumns, order) {
		var filteredObjs = locationColumns.filter(function(e) { return e.order === order; });
		if (filteredObjs.length === 1) {
			return filteredObjs[0];
		} else {
			var newObj = {locationType: "latlong", order: order};
			locationColumns.push(newObj);
			return newObj;
		}
	},

	extractLocationColumns: function(filterSpec) {
		var locationType, locationColumns = [];
		for (var key in filterSpec) {
			if (filterSpec.hasOwnProperty(key) &&
					(filterSpec[key].type === "location" || filterSpec[key].type === "location_extra")) {
				locationType = filterSpec[key].locationType;
				if (locationType === "country_code" ||
						locationType === "country_code_list") {
					locationColumns.push({
						name: key,
						locationType: locationType,
						order: filterSpec[key].locationOrder
					});
				} else if (["latLongName", "latitude", "longitude"].indexOf(locationType) !== -1) {
					var order = filterSpec[key].locationOrder;
					var locationObj = this.getOrCreateLatLongLocationColumn(locationColumns, order);
					if (locationType === "latLongName") {
						locationObj.name = key;
					} else if (locationType === "latitude") {
						locationObj.latitude = key;
					} else if (locationType === "longitude") {
						locationObj.longitude = key;
					}
				} else {
					console.log("unknown locationType: " + locationType);
				}
			}
		}
		locationColumns.sort(function(a, b) { return a.order - b.order; });
		return locationColumns;
	},

	addCountryCodeToPoints: function(countryCode, points) {
		if (countryCode === "" || countryCode === "XX") {
			return;
		}
		var country = new route.PointCountry(countryCode);
		if (country.point !== undefined) {
			points.push(country);
		} else if (this.loadingCsv) {
			this.loadErrors.unknownCountries[countryCode] = true;
		}
	},

	getPointsFromRow: function(row, locationColumns) {
		var i, j, points = [];
		for (i = 0; i < locationColumns.length; i++) {
			var locationType = locationColumns[i].locationType;
			if (locationType === "country_code") {
				var countryCode = row[locationColumns[i].name].trim();
				this.addCountryCodeToPoints(countryCode, points);
			} else if (locationType === "country_code_list") {
				var countryCodes = row[locationColumns[i].name].split(",");
				for (j = 0; j < countryCodes.length; j++) {
					this.addCountryCodeToPoints(countryCodes[j].trim(), points);
				}
			} else if (locationType === "latlong") {
				var name = row[locationColumns[i].name];
				var latitude = parseFloat(row[locationColumns[i].latitude]);
				var longitude = parseFloat(row[locationColumns[i].longitude]);
				points.push(new route.PointNameLatLong(name, latitude, longitude));
			} else {
				// TODO: deal with lat/long
				console.log("unknown locationType: " + locationType);
			}
		}
		return points;
	},

	csvToRoutes: function(csvData, filterValues, filterSpec) {
		var points, quantity, row,
			locationColumns = this.extractLocationColumns(filterSpec),
			routes = new route.RouteCollection();

		// only reset/update the unknownCountries when loading the CSV
		if (this.loadingCsv) { this.loadErrors.unknownCountries = {}; }

		for (var i = 0; i < csvData.length; i++) {
			row = csvData[i];

			// filter out rows that don't match our criteria
			if (!this.filterPasses(row, filterValues)) { continue; }

			// if the quantity is missing for this column, skip this row
			quantity = parseFloat(row[filterValues.quantityColumn.value]);
			if (isNaN(quantity)) {
				continue;
			}

			points = this.getPointsFromRow(row, locationColumns);
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
		var value,
			unique = {},  // to track what we've already got
			distinct = [];
		for (var i = 0; i < csvData.length; i++) {
			value = csvData[i][column].trim();
			if (typeof(unique[value]) === "undefined") {
				distinct.push(value);
				unique[value] = true;
			}
		}
		return distinct.sort();
	},

	getUniqueCommaSeparatedValuesFromCsvColumn: function(csvData, column) {
		var valueList, value,
			unique = {},  // to track what we've already got
			distinct = [];
		for (var i = 0; i < csvData.length; i++) {
			valueList = csvData[i][column].split(",");
			for (var j = 0; j < valueList.length; j++) {
				value = valueList[j].trim();
				if (typeof(unique[value]) === "undefined") {
					distinct.push(value);
					unique[value] = true;
				}
			}
		}
		return distinct.sort();
	},

	csvToFilters: function(csvData, filterSpec) {
		var minmax, filters = {Quantity: {type: "quantity", values: []}};
		for (var column in filterSpec) {
			if (filterSpec.hasOwnProperty(column)) {
				// skip columns not present in data
				if (!csvData[0].hasOwnProperty(column)) { continue; }
				// skip the ignore column
				if (filterSpec[column].type === "ignore") { continue; }

				if (filterSpec[column].type === "quantity") {
					// quantity columns just get added to a list
					filters.Quantity.values.push(column);
					continue;
				}

				filters[column] = {
					type: filterSpec[column].type,
					multiValueColumn: false
				};
				if (filterSpec[column].hasOwnProperty("multiselect")) {
					filters[column].multiselect = filterSpec[column].multiselect;
				}
				// TODO: add textmapping? date?
				if (filterSpec[column].type === "text") {
					filters[column].values = this.getUniqueValuesFromCsvColumn(csvData, column);
				} else if (filterSpec[column].type === "text_list") {
					filters[column].values = this.getUniqueCommaSeparatedValuesFromCsvColumn(csvData, column);
					filters[column].multiValueColumn = true;
				} else if (filterSpec[column].type === "number") {
					minmax = this.getMinMaxValuesFromCsvColumn(csvData, column);
					filters[column].min = minmax[0];
					filters[column].max = minmax[1];
				} else if (filterSpec[column].type === "location") {
					if (filterSpec[column].locationType === "country_code" ||
							filterSpec[column].locationType === "latLongName") {
						filters[column].values = this.getUniqueValuesFromCsvColumn(csvData, column);
					} else if (filterSpec[column].locationType === "country_code_list") {
						filters[column].values = this.getUniqueCommaSeparatedValuesFromCsvColumn(csvData, column);
						filters[column].multiValueColumn = true;
					} else if (filterSpec[column].locationType === "latitude" ||
							filterSpec[column].locationType === "longitude") {
						// do nothing, handled by latLongName column
					} else {
						console.log("Unknown locationType: " + filterSpec[column].locationType);
					}
				} else if (filterSpec[column].type === "location_extra") {
					// do nothing - handled by the corresponding location column
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
	}

	};
});
