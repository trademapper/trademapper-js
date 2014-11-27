define([
    'trademapper.csv.definition',
    'trademapper.customcsv',
    'trademapper.route',
    'util',
    'd3'
], function(
    csvdefs,
    CustomCsv,
    route,
    util,
    d3
) {
	"use strict";

	return {

	skipCsvAutoDetect: false,
	fileInputElement: null,
	csvDataLoadedCallback: null,
	csvFilterLoadedCallback: null,
	errorCallback: null,
	loadingCsv: false,
	loadErrors: null,
	csvFile: null,
	csvFileName: null,
	filters: null,

	init: function(dataLoadedCallback, filterLoadedCallback, error_callback, skipCsvAutoDetect) {
		this.csvDataLoadedCallback = dataLoadedCallback;
		this.csvFilterLoadedCallback = filterLoadedCallback;
		this.errorCallback = error_callback;
		this.skipCsvAutoDetect = skipCsvAutoDetect;
		this.resetLoadErrors();
	},

	resetLoadErrors: function() {
		this.loadErrors = {
			unknownCSVFormat: [],
			unknownCountries: {},
			badUrl: []
		};
	},

	setFileInputElement: function(fileInput) {
		this.fileInputElement = fileInput;
		if (this.fileInputElement !== null) {
			var moduleThis = this;
			this.fileInputElement.on('change', function() {moduleThis.loadCSVFile();});
		}
	},

	setUrlInputElement: function(urlInput, button) {
		var moduleThis = this;
		this.urlInputElement = urlInput;
		// on enter, load the CSV
		this.urlInputElement.on("keypress", function() {
			// if enter, load the URL
			if (d3.event.keyCode === 13) {
				moduleThis.loadCSVUrl();
				return false;
			} else {
				return true;
			}
		});
		if (button !== null) {
			button.on("click", function () { moduleThis.loadCSVUrl(); });
		}
	},

	setSuccessCallback: function(success_callback) {
		this.csvDataLoadedCallback = success_callback;
	},

	loadCSVFile: function() {
		this.resetLoadErrors();
		this.csvFile = this.fileInputElement[0][0].files[0];
		this.csvFileName = this.csvFile.name;

		var reader = new FileReader();
		var moduleThis = this;

		reader.onload = function(e) {
			moduleThis.loadingCsv = true;
			moduleThis.processCSVString(reader.result);
			moduleThis.loadingCsv = false;
		};
		reader.readAsText(this.csvFile);
	},

	loadCSVUrl: function(csvUrl) {
		this.resetLoadErrors();
		if(!csvUrl) {
			csvUrl = this.urlInputElement.node().value;
		}
		if(csvUrl && csvUrl.length > 0) {
			var moduleThis = this,
				succeeded = false,
				finished = false,
				urlList = [csvUrl, util.corsProxy(csvUrl)];
			// if we use the corsProxy on a URL that already does CORS
			// then the download will fail, so try both directly and via
			// corsProxy
			for (var i = 0; i < urlList.length; i++) {
				var url = urlList[i];
				d3.xhr(url, function (error, req) {
					if (succeeded) { return; }
					if (!error && req.status === 200) {
						finished = succeeded = true;
						moduleThis.processCSVString(req.response);
					} else {
						console.log("unable to download", error, req);
						moduleThis.loadErrors.badUrl.push("unable to download " + url +
							" due to error: " + error.toString());
						finished = true;
					}
				});
			}
			// sleep for 5 seconds, if not succeeded then show errors
			// TODO: add indicator to say we're trying
			var reportErrors = function() {
				// show errors - or clear them if necessary
				moduleThis.errorCallback();
				// if not finished, try showing errors again in a bit
				if (!finished) {
					window.setTimeout(reportErrors, 2000);
				}
			};
			window.setTimeout(reportErrors, 1000);
		}
	},

	loadErrorsToStrings: function() {
		var countryInfo, errorMsgs = [],
			unknownCountries = Object.keys(this.loadErrors.unknownCountries);
		errorMsgs = errorMsgs.concat(this.loadErrors.badUrl);
		errorMsgs = errorMsgs.concat(this.loadErrors.unknownCSVFormat);
		unknownCountries.sort();
		for (var i = 0; i < unknownCountries.length; i++) {
			countryInfo = this.loadErrors.unknownCountries[unknownCountries[i]];
			if (countryInfo.columnType === "single" && unknownCountries[i].length > 2) {
				errorMsgs.push('Multiple country codes found when only one expected: "' +
						unknownCountries[i] +
						'" (row ' + countryInfo.rowIndex +
						', column "' + countryInfo.columnName + '")');
			} else {
				errorMsgs.push('Unknown country code "' + unknownCountries[i] +
						'" (eg. row ' + countryInfo.rowIndex +
						', column "' + countryInfo.columnName + '")');
			}
		}
		return errorMsgs;
	},

	autodetectCsvType: function(firstLine) {
		var csvtype = null;
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
		return null;
	},

	autoFetchFilterSpec: function(firstLine) {
		var csvtype = this.autodetectCsvType(firstLine);
		if (csvtype === null) {
			return null;
		} else {
			return csvdefs.filterSpec[csvtype];
		}
	},

	// TODO: change to use csvFirstTenRows
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
		var csvData, csvFirstTenRows,
			filterSpec = null,
			firstLine = fileText.substring(0, fileText.indexOf("\n"));

		fileText = this.trimCsvColumnNames(fileText);
		csvData = d3.csv.parse(fileText);
		csvFirstTenRows = d3.csv.parseRows(fileText).slice(0, 10);

		// skipCsvAutoDetect is set by URL parameter - to help development
		if (!this.skipCsvAutoDetect) {
			filterSpec = this.autoFetchFilterSpec(firstLine);
		}
		if (filterSpec) {
			this.processParsedCSV(csvData, csvFirstTenRows, filterSpec);
		} else {
			var customFilterSpecCallback = function(customFilterSpec) {
				this.processParsedCSV(csvData, csvFirstTenRows, customFilterSpec);
			}.bind(this);
			CustomCsv.init(csvFirstTenRows, csvData.length, null, customFilterSpecCallback);
		}
	},

	editFilterSpec: function(csvData, csvFirstTenRows, filterSpec) {
		var editFilterSpecCallback = function(editedFilterSpec) {
			this.processParsedCSV(csvData, csvFirstTenRows, editedFilterSpec);
		}.bind(this);
		CustomCsv.init(csvFirstTenRows, csvData.length, filterSpec, editFilterSpecCallback);
	},

	processParsedCSV: function(csvData, csvFirstTenRows, filterSpec) {
		this.filters = this.csvToFilters(csvData, filterSpec);
		this.csvFilterLoadedCallback(csvData, filterSpec, this.filters);
		this.csvDataLoadedCallback(csvData, csvFirstTenRows, filterSpec);
	},

	getMinMaxYear: function(filters) {
		var yearFilter = null;
		Object.keys(filters).forEach(function(key) {
			if (filters[key].type === 'year') {
				yearFilter = filters[key];
			}
		});
		if (yearFilter !== null) {
			return [yearFilter.min, yearFilter.max];
		} else {
			return [0, 0];
		}
	},

	filterDataAndReturnRoutes: function(csvData, filterSpec, filterValues) {
		return this.csvToRoutes(csvData, filterSpec, filterValues);
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
			var newObj = {
				locationType: "latlong",
				order: order
			};
			locationColumns.push(newObj);
			return newObj;
		}
	},

	extractLocationColumns: function(filterSpec) {
		var locationType, locationColumns = [];
		for (var key in filterSpec) {
			if (filterSpec.hasOwnProperty(key) &&
					(filterSpec[key].type === "location" || filterSpec[key].type === "location_extra")) {
				if (filterSpec[key].type === "location") {
					locationType = filterSpec[key].locationType;
				} else {
					locationType = filterSpec[key].locationExtraType;
				}

				if (locationType === "country_code" ||
						locationType === "country_code_list") {
					locationColumns.push({
						name: key,
						locationType: locationType,
						locationRole: filterSpec[key].locationRole,
						order: filterSpec[key].locationOrder
					});
				} else if (["latLongName", "latitude", "longitude"].indexOf(locationType) !== -1) {
					var order = filterSpec[key].locationOrder;
					var locationObj = this.getOrCreateLatLongLocationColumn(locationColumns, order);
					if (locationType === "latLongName") {
						locationObj.name = key;
						locationObj.locationRole = filterSpec[key].locationRole;
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

	addCountryCodeToPoints: function(countryCode, role, points, rowIndex, columnName, columnType) {
		if (countryCode === "") {
			return;
		}
		var country = new route.PointCountry(countryCode, role);
		if (country.point !== undefined) {
			points.push(country);
		} else if (this.loadingCsv) {
			// Note we will end up with only one rowIndex/columnName for each
			// missing country, even if it appears more than once.
			this.loadErrors.unknownCountries[countryCode] = {
				rowIndex: rowIndex,
				columnName: columnName,
				columnType: columnType
			};
		}
	},

	getPointsFromRow: function(row, locationColumns, rowIndex) {
		var i, j, points = [];
		for (i = 0; i < locationColumns.length; i++) {
			var locationType = locationColumns[i].locationType,
				locName = locationColumns[i].name,
				role = locationColumns[i].locationRole;

			if (locationType === "country_code") {
				var countryCode = row[locationColumns[i].name].trim();
				this.addCountryCodeToPoints(
					countryCode, role, points, rowIndex, locName, "single");

			} else if (locationType === "country_code_list") {
				var countryCodes = row[locationColumns[i].name].split(",");
				for (j = 0; j < countryCodes.length; j++) {
					this.addCountryCodeToPoints(
						countryCodes[j].trim(), role, points, rowIndex, locName, "list");
				}

			} else if (locationType === "latlong") {
				var name = row[locationColumns[i].name];
				var latitude = parseFloat(row[locationColumns[i].latitude]);
				var longitude = parseFloat(row[locationColumns[i].longitude]);
				points.push(new route.PointNameLatLong(name, role, latitude, longitude));

			} else {
				// TODO: deal with lat/long
				console.log("unknown locationType: " + locationType);
			}
		}
		return points;
	},

	csvToRoutes: function(csvData, filterSpec, filterValues) {
		var points, quantity, row,
			filteredRowCount = 0,
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

			points = this.getPointsFromRow(row, locationColumns, i);
			routes.addRoute(new route.Route(points, quantity));
			filteredRowCount++;
		}

		console.log("Filtered rows: " + filteredRowCount + ", total rows: " + csvData.length);
		return routes;
	},

	calcMaxSingleYearQuantity: function(csvData, filterSpec, filterValues, arrowType, yearColumnName, minYear, maxYear) {
		var localFilterValues, routes, quantity,
			maxQuantity = 0;

		for (var year = minYear; year <= maxYear; year++) {
			localFilterValues = util.deepCopy(filterValues);
			localFilterValues[yearColumnName].minValue = year;
			localFilterValues[yearColumnName].maxValue = year;

			routes = this.csvToRoutes(csvData, filterSpec, localFilterValues);
			if (arrowType === 'plain-arrows') {
				quantity = routes.maxQuantity();
			} else if (arrowType === 'flowmap') {
				var ctAndMax = routes.getCenterTerminalList();
				quantity = ctAndMax.maxSourceQuantity;
			} else {
				console.log("calcMaxSingleYearQuantity: unknown arrowType: " + arrowType);
				quantity = 0;
			}
			if (quantity > maxQuantity) {
				maxQuantity = quantity;
			}
		}
		return maxQuantity;
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

				filters[column] = {multiValueColumn: false};
				for (var attr in filterSpec[column]) {
					if (filterSpec[column].hasOwnProperty(attr)) {
						filters[column][attr] = filterSpec[column][attr];
					}
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
	},

	/*
	 * find the unit - so we can display it
	 */
	getUnit: function(filterSpec, filterValues) {
		var unit = null;
		// first check if any column is marked as isUnit
		for (var filterName in filterSpec) {
			if (filterSpec.hasOwnProperty(filterName)) {
				// - if so use the currently selected choice from that column
				if (filterSpec[filterName].isUnit) {
					if (filterValues[filterName].any) {
						unit = "Any Unit";
					} else if (filterValues[filterName].multiselect) {
						unit = filterValues[filterName].valueList.join(", ");
					} else {
						unit = filterValues[filterName].value;
					}
					if (unit === "") {
						unit = "&lt;Blank " + filterName + "&gt;";
					}
					break;
				}
			}
		}
		// - else use the currently selected value of the quantity column
		if (!unit) {
			unit = filterValues.quantityColumn.value;
		}
		return unit;
	}

	};
});
