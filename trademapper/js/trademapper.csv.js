
define(['d3', 'trademapper.route'], function(d3, route) {
	"use strict";
	return {
	fileInputElement: null,
	csvDataLoadedCallback: null,
	csvFilterLoadedCallback: null,
	errorCallback: null,
	loadingCsv: false,
	loadErrors: {
		unknownCountries: {}
	},
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
		if (unknownCountries.length > 0) {
			unknownCountries.sort();
			errorMsgs.push("Unknown country codes: " + unknownCountries.join(", "));
		}
		return errorMsgs;
	},

	autodetectCsvType: function(firstLine) {
		// get the first line, lower case, and remove spaces
		firstLine = firstLine.toLowerCase().replace(/[^\w,]/g, '');

		if (this.csvHeaderToType.hasOwnProperty(firstLine)) {
			return this.csvHeaderToType[firstLine];
		}
	},

	/*
	 * make a RouteCollection from a CSV string
	 */
	processCSVString: function(fileText) {
		var firstLine = fileText.substring(0, fileText.indexOf("\n"));
		var csvType = this.autodetectCsvType(firstLine);
		if (csvType) {
			var csvData = d3.csv.parse(fileText);
			this.processParsedCSV(csvData, csvType);
		} else {
			console.log("unknown CSV header: " + firstLine);
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
		if (!this.filterSpec.hasOwnProperty(csvType)) {
			this.errorCallback("unknown csvType: " + csvType);
		}
		var filters = this.csvToFilters(csvData, this.filterSpec[csvType]);
		this.csvFilterLoadedCallback(csvType, csvData, filters);
		this.csvDataLoadedCallback(csvType, csvData);
	},

	filterDataAndReturnRoutes: function(csvType, csvData, filterValues) {
		if (!this.filterSpec.hasOwnProperty(csvType)) {
			this.errorCallback("unknown csvType: " + csvType);
			return null;
		}
		return this.csvToRoutes(csvData, filterValues, this.filterSpec[csvType]);
	},

	filterPasses: function(row, filterValues) {
		var filter, filterName, rowValue;
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
					if (filter.any === false && filter.valueList.indexOf(rowValue) === -1) {
						return false;
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

			points = [];
			for (var j = 0; j < locationColumns.length; j++) {
				locationType = locationColumns[j].locationType;
				if (locationType === "country_code") {
					var countryCode = row[locationColumns[j].name].trim();
					if (countryCode.length > 0 && countryCode !== 'XX') {
						var country = new route.PointCountry(countryCode);
						if (country.point !== undefined) {
							points.push(country);
						} else if (this.loadingCsv) {
							this.loadErrors.unknownCountries[countryCode] = true;
						}
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
		},
		etis: {
			// the header of the ETIS CSV is:
			// ETIS Ref. No.,Seizure Year,Seizure Date,Source of Data,Agency responsible for seizure,Activity,Place of discovery,City of discovery,Country of Discov-ery,Countries of origin,Countries of export/re-export,Countries of transit,Country of destina-tion/im-port,Raw Ivory No. Pcs,Raw Ivory  Wt (kg),Worked Ivory No. Pcs,Worked Ivory Wt (kg),Ivory Comment,Other Contraband Seized,Mode of Transport,Method of Concealment,Method of Detection,Suspects' Nationalities,Additional Information
			"ETIS Ref. No.": {
				type: "ignore"
			},
			"Seizure Year": {
				type: "year"
			},
			"Seizure Date": {
				// TODO: anything?
				type: "ignore"
			},
			"Source of Data": {
				// TODO: sample file has no data for this column
				type: "text",
				multiselect: true
			},
			"Agency responsible for seizure": {
				// TODO: sample file has no data for this column
				type: "text",
				multiselect: true
			},
			"Activity": {
				// TODO: work this out, example suggested multiple values per cell
				type: "ignore"
			},
			"Place of discovery": {
				type: "text",
				multiselect: true
			},
			"City of discovery": {
				type: "text",
				multiselect: true
			},
			"Country of Discov-ery": {
				// TODO: seizing/discovery is a point already on the route
				// need to decide how to show this
				type: "ignore"
			},
			"Countries of origin": {
				// TODO: this could have multiple countries, don't know how to display
				type: "ignore"
			},
			"Countries of export/re-export": {
				type: "location",
				locationOrder: 1,
				locationType: "country_code",
				multiselect: true
			},
			"Countries of transit": {
				// TODO: handle the fact this could have multiple country codes!
				type: "location",
				locationOrder: 2,
				locationType: "country_code",
				multiselect: true
			},
			"Country of destina-tion/im-port": {
				type: "location",
				locationOrder: 3,
				locationType: "country_code",
				multiselect: true
			},
			"Raw Ivory No. Pcs": {
				type: "quantity"
			},
			"Raw Ivory  Wt (kg)": {
				type: "quantity"
			},
			"Worked Ivory No. Pcs": {
				type: "quantity"
			},
			"Worked Ivory Wt (kg)": {
				type: "quantity"
			},
			"Ivory Comment": {
				type: "ignore"
			},
			"Other Contraband Seized": {
				// TODO: sample file has no data for this column
				type: "ignore"
			},
			"Mode of Transport": {
				type: "text",
				multiselect: true
			},
			"Method of Concealment": {
				type: "ignore"
			},
			"Method of Detection": {
				// TODO: work this out, example suggested multiple values per cell
				type: "ignore"
			},
			"Suspects' Nationalities": {
				// TODO: sample file has no data for this column
				type: "ignore"
			},
			"Additional Information": {
				// TODO: sample file has no data for this column
				type: "ignore"
			}
		}
	},

	csvHeaderToType: {
		"year,app,family,taxon,importer,exporter,origin,importerreportedquantity,exporterreportedquantity,term,unit,purpose,source": "cites",
		"etisrefno,seizureyear,seizuredate,sourceofdata,agencyresponsibleforseizure,activity,placeofdiscovery,cityofdiscovery,countryofdiscovery,countriesoforigin,countriesofexportreexport,countriesoftransit,countryofdestinationimport,rawivorynopcs,rawivorywtkg,workedivorynopcs,workedivorywtkg,ivorycomment,othercontrabandseized,modeoftransport,methodofconcealment,methodofdetection,suspectsnationalities,additionalinformation": "etis"
	}

	};
});
