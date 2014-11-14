/*
 * The main trademapper library
 *
 * trademapper.js is the main file - it loads and configures the other
 * trademapper files, including setting callbacks.
 *
 * INITIALISATION
 *
 * It is set up by calling the `init()` function which takes the following
 * arguments:
 *
 * - mapId - the id of the HTML element where the map should be inserted
 * - fileFormElementId - the id of the HTML element where the file form should
 *   be inserted.  (The file form is the form where you specify the file to use).
 * - filterFormElementId - the id of the HTML element where the filter form
 *   should be inserted.  (The filter form allows you to filter the data once it
 *   is loaded, so only a subset of the data is displayed on the map).
 * - config - an object with various other config elements.  An empty object is fine.
 *
 * The config has default values which can be seen in the `defaultConfig` object
 *
 * The init function:
 *
 * - caches the URL parameters and dom elements
 * - creates the form to load the CSV, the SVG element for the map, the slider
 *   and the tooltip
 * - calls init for mapper, arrows and csv, and pokes callbacks into route
 *   and filterform
 * - sets up the toggle for the sidebar and the year slider
 * - finally, if there is a URL parameter, it loads a CSV file from that URL
 *
 * CONTROL FLOW
 *
 * There is a listener on the form element to load a CSV.  When that form is
 * filled in, the csv module:
 *
 * - loads the csv using d3
 * - finds the csv type (and hence filterSpec) and from them it constructs the
 *   filters object
 * - calls filterLoadedCallback() with the csvData and the filters object -
 *   this is used to initialise the filterform, which then maintains its own
 *   filterValues object based on the filters object and the values set in the
 *   form by the user.
 * - calls csvLoadedCallback().  That caches the csvData and then calls
 *   showFilteredCsv() to actually display the data - see below.
 *
 * The filterform listens for any change on the constituent parts of its form.  On
 * any change it will update its filterValues and then call filterformChangedCallback()
 * which again calls showFilteredCsv()
 *
 * The slider also listens for any change to its value.  It will then make a copy
 * of the filterform values, update the year range, and of course call showFilteredCsv()
 *
 * showFilteredCsv() is the heart of displaying and re-displaying the data.  It calls
 * the csv module to convert the csv data into an aggregated RouteCollection based
 * on filterform.filterValues.  The arrows module is then used to draw the
 * RouteCollection and the legend.  Finally mapper is used to colour in the
 * countries involved in the trade.
 *
 * DATA STRUCTURES
 *
 * So the key data structures are:
 *
 * - filterSpec - a specification for the filters for a type of CSV.  It is
 *   used, along with the data from a CSV file to generate the filters.  See
 *   trademapper.csv.definition.js for some filterSpec examples.
 * - filters - a specification based on the filterSpec and the actual
 *   values found in a particular CSV.  It is used to generated the various
 *   filters in the UI.  Search for returnedFilters in tests/js/test-csv.js
 *   to see an example of the filters data structure.
 * - filterValues - the current values of the filters specified in the UI
 *
 * All these have the CSV column name as the main key, and they vary in what
 * they store for each column name.
 */
define([
	"jquery",
	"d3",
	"trademapper.arrows",
	"trademapper.csv",
	"trademapper.filterform",
	"trademapper.mapper",
	"trademapper.route",
	"trademapper.yearslider",
	"util",
	"text!../fragments/filterskeleton.html",
	"text!../fragments/csvformskeleton.html",
	"text!../fragments/yearsliderskeleton.html",
],
function($, d3, arrows, csv, filterform, mapper, route, yearslider, util,
		 filterSkeleton, csvFormSkeleton, yearSliderSkeleton) {
	"use strict";

	return {
	config: null,
	mapRootElement: null,
	fileFormElement: null,
	filterFormElement: null,
	toolbarElement: null,
	tooltipElement: null,
	fileInputElement: null,
	changeOverTimeElement: null,
	tmsvg: null,
	svgDefs: null,
	zoomg: null,
	controlg: null,
	currentCsvData: null,
	currentCsvType: null,
	minMaxYear: [0, 0],
	currentUnit: null,
	queryString: null,
	yearColumnName: null,

	defaultConfig: {
			ratio: 0.86,
			arrowColours: {
				opacity: 0.6,
				pathStart: "rgba(0,0,0,1)",
				pathEnd: "rgba(0,0,0,0.4)"
			},
			pointTypeSize: {
				origin: 6,
				exporter: 4.5,
				transit: 3.2,
				importer: 2.5
			},
			minArrowWidth: 1,
			maxArrowWidth: 25,
			arrowType: "plain-arrows"  // could be "plain-arrows" or "flowmap"
		},

	init: function(mapId, fileFormElementId, filterFormElementId,
	               changeOverTimeElementId, tmConfig) {
		this.queryString = util.queryString();
		this.mapRootElement = d3.select(mapId);
		this.fileFormElement = d3.select(fileFormElementId);
		this.filterFormElement = d3.select(filterFormElementId);
		this.changeOverTimeElement = d3.select(changeOverTimeElementId);
		this.setConfigDefaults(tmConfig);

		this.createCsvOnlyForm();

		this.tmsvg = this.mapRootElement.insert("svg")
			.attr("width", this.config.width)
			.attr("height", this.config.height)
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "0 -120 900 500");
		this.svgDefs = this.tmsvg.append("defs");
		this.zoomg = this.tmsvg.append("g").attr("class", "zoomgroup");
		// append a background rectangle so mouse scroll zoom works over sea
		this.zoomg.append("rect")
			.attr("width", "150%")
			.attr("height", "150%")
			.attr("y", "-150")
			.attr("class", "mapocean");
		this.controlg = this.tmsvg.append("g").attr("class", "controlgroup");

		this.changeOverTimeElement.html(yearSliderSkeleton);
		this.tooltipElement = this.mapRootElement.append("div")
			.attr("id", "maptooltip");

		// need to init mapper before arrows otherwise the map is on top of
		// the arrows
		mapper.init(this.zoomg, this.controlg, this.svgDefs, this.config);
		arrows.init(this.tmsvg, this.zoomg, this.svgDefs, '#maptooltip', this.config.arrowColours,
			this.config.minArrowWidth, this.config.maxArrowWidth, this.config.pointTypeSize,
			mapper.countryCodeToInfo);

		// set up the various callbacks we need to link things together
		var moduleThis = this;
		csv.init(
			function(csvType, csvData) { moduleThis.csvLoadedCallback(csvType, csvData); },
			function(csvType, csvData, filters) { moduleThis.filterLoadedCallback(csvType, csvData, filters); },
			function(msg) { moduleThis.csvLoadErrorCallback(msg); });

		route.setCountryGetPointFunc(function(countryCode) {return mapper.countryCentrePoint(countryCode);});
		route.setLatLongToPointFunc(function(latLong) {return mapper.latLongToPoint(latLong);});
		filterform.formChangedCallback = function(columnName) {return moduleThis.filterformChangedCallback(columnName); };
		yearslider.showTradeForYear = function(year) {return moduleThis.showTradeForYear(year); };
		this.setUpAsideToggle();
		yearslider.create();

		if (this.queryString.hasOwnProperty("loadcsv")) {
			this.loadCsvFromUrl();
		}
	},

	setConfigDefaults: function(tmConfig) {
		this.config = tmConfig || {};

		// set defaults for all
		for (var key in this.defaultConfig) {
			if (this.defaultConfig.hasOwnProperty(key)) {
				this.config[key] = this.config[key] || this.defaultConfig[key];
			}
		}

		if (this.queryString.hasOwnProperty("arrowtype")) {
			if (this.queryString.arrowtype === "spiral-tree") {
				// convert legacy name to new name
				this.config.arrowType = "flowmap";
			} else if (['plain-arrows', 'flowmap'].indexOf(this.queryString.arrowtype) !== -1) {
				this.config.arrowType = this.queryString.arrowtype;
			} else {
				console.log("Unknown arrowtype in query string: " + this.queryString.arrowtype);
			}
		}
		if (this.queryString.hasOwnProperty("maxarrowwidth")) {
			var maxArrowWidth = parseInt(this.queryString.maxarrowwidth);
			if (maxArrowWidth > 0) {
				this.config.maxArrowWidth = maxArrowWidth;
			}
		}
		if (this.queryString.hasOwnProperty("minarrowwidth")) {
			var minArrowWidth = parseInt(this.queryString.minarrowwidth);
			if (minArrowWidth > 0) {
				this.config.minArrowWidth = minArrowWidth;
			}
		}

		// work out some stuff from the size of the element we're attached to
		if (!this.config.hasOwnProperty("width")) {
			this.config.width = parseInt(this.mapRootElement.style('width'));
		}
		if (!this.config.hasOwnProperty("height")) {
			this.config.height = this.config.width * this.config.ratio;
		}
	},

	setUpAsideToggle: function() {
		// TODO: make the document element id configurable
		var filterToggle = document.getElementById('filter-toggle'),
			filterPanel = document.getElementById('filter-panel');

		filterToggle.onclick = function() {
			filterPanel.classList.toggle('toggled');
			if (filterPanel.classList.contains('toggled')) {
				filterToggle.textContent = "Show filters";
			} else {
				filterToggle.textContent = "Hide filters";
			}
		};
	},

	showTradeForYear: function(year) {
		// guard against the value not being set
		if (!year || !this.yearColumnName) { return; }
		// this does a deep clone of the object
		var filterValues = $.extend(true, {}, filterform.filterValues);
		// now we set the year to this year
		filterValues[this.yearColumnName].minValue = year;
		filterValues[this.yearColumnName].maxValue = year;
		this.showFilteredCsv(filterValues);
	},

	loadCsvFromUrl: function() {
		var csvUrl = decodeURIComponent(this.queryString.loadcsv);
		csv.loadCSVUrl(csvUrl);
	},

	showNowWorking: function() {
		console.log("start working");
	},

	stopNowWorking: function() {
		console.log("work finished");
	},

	createCsvOnlyForm: function() {
		this.fileFormElement.html(csvFormSkeleton);
		this.fileInputElement = this.fileFormElement.select("#fileinput");
		csv.setFileInputElement(this.fileInputElement);
		csv.setUrlInputElement(this.fileFormElement.select("#urlinput"),
							this.fileFormElement.select("#url-download-button"));
	},

	createFilterForm: function(filters) {
		// generate the form for playing with the data
		this.filterFormElement.html(filterSkeleton);
		filterform.createFormFromFilters(this.filterFormElement, filters, mapper.countryCodeToName);
	},

	filterLoadedCallback: function(csvType, csvData, filters) {
		var yearColumns = filterform.getFilterNamesForType(filters, ["year"]);
		if (yearColumns.length === 1) {
			this.yearColumnName = yearColumns[0];
		}
		this.minMaxYear = csv.getMinMaxYear(filters);
		yearslider.setYears(this.minMaxYear[0], this.minMaxYear[1]);
		this.createFilterForm(filters);
	},

	showFilteredCsv: function(filterValues) {
		this.showNowWorking();
		arrows.clearTooltip();
		mapper.resetZoom();
		var routes = csv.filterDataAndReturnRoutes(
			this.currentCsvType, this.currentCsvData, filterValues);
		if (!routes) {
			console.log("failed to get routes");
			return;
		}

		var pointRoles = routes.getPointRoles();
		this.currentUnit = csv.getUnit(this.currentCsvType, filterValues);
		arrows.currentUnit = this.currentUnit;
		// now draw the routes
		if (this.config.arrowType === "plain-arrows") {
			arrows.drawRouteCollectionPlainArrows(routes, pointRoles);
		} else if (this.config.arrowType === "flowmap") {
			arrows.drawRouteCollectionFlowmap(routes, pointRoles);
		} else {
			console.log("unknown config.arrowType: " + this.config.arrowType);
		}
		arrows.drawLegend();
		// colour in the countries that are trading
		mapper.colorTradingCountries(pointRoles);
		this.stopNowWorking();
	},

	filterformChangedCallback: function(columnName) {
		this.showFilteredCsv(filterform.filterValues);
	},

	csvLoadedCallback: function(csvType, csvData) {
		// first cache the current values, so we can regenerate if we want
		this.currentCsvData = csvData;
		this.currentCsvType = csvType;

		document.querySelector("body").classList.add("csv-data-loaded");
		this.reportCsvLoadErrors();
		this.showFilteredCsv(filterform.filterValues);
	},

	reportCsvLoadErrors: function() {
		var errorDetails,
			errorMsgList = csv.loadErrorsToStrings(),
			errorFieldset = d3.select(".csv-load-errors");

		// clear errors
		errorFieldset.classed("haserror", false);

		// return here if no error
		if (errorMsgList.length === 0) { return; }

		errorFieldset.classed("haserror", true);

		errorFieldset.html('<p><strong>Errors:</strong> <span class="showhide">Show</span></p>');
		errorDetails = errorFieldset.append("div")
			.attr("id", "csv-load-error-details")
			.attr("style", "display: none");
		for (var i = 0; i < errorMsgList.length; i++) {
			errorDetails.append("p").text(errorMsgList[i]);
		}

		var moduleThis = this;
		errorFieldset.select(".showhide").on("click", function() { moduleThis.csvLoadErrorShowHide(); });
	},

	csvLoadErrorShowHide: function() {
		var errorDetails = document.getElementById("csv-load-error-details");
		var showHide = document.querySelector(".csv-load-errors > p > span.showhide");
		if (errorDetails.style.display === "block") {
			errorDetails.style.display = "none";
			showHide.textContent = "Show";
		} else {
			errorDetails.style.display = "block";
			showHide.textContent = "Hide";
		}
	},

	csvLoadErrorCallback: function() {
		this.reportCsvLoadErrors();
	}

	};
});
