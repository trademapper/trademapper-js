/*
 * The main trademapper library
 */
define(
	[
		"trademapper.arrows",
		"trademapper.csv",
		"trademapper.filterform",
		"trademapper.mapper",
		"trademapper.route",
		"util",
		"d3",
		"text!../fragments/filterskeleton.html",
		"text!../fragments/csvformskeleton.html"
	],
	function(arrows, csv, filterform, mapper, route, util,
			 d3, filterSkeleton, csvFormSkeleton) {
	"use strict";

	return {
	config: null,
	mapRootElement: null,
	fileFormElement: null,
	filterFormElement: null,
	tooltipElement: null,
	fileInputElement: null,
	tmsvg: null,
	svgDefs: null,
	zoomg: null,
	controlg: null,
	currentCsvData: null,
	currentCsvType: null,
	currentUnit: null,
	queryString: null,

	defaultConfig: {
			ratio: 0.6,
			arrowColours: {
				pathStart: "black",
				pathEnd: "#ff6600"
			},
			minArrowWidth: 1,
			maxArrowWidth: 25,
			arrowType: "plain-arrows"  // could be "plain-arrows" or "spiral-tree"
		},

	init: function(mapId, fileFormElementId, filterFormElementId, tmConfig) {
		this.queryString = util.queryString();
		this.mapRootElement = d3.select(mapId);
		this.fileFormElement = d3.select(fileFormElementId);
		this.filterFormElement = d3.select(filterFormElementId);
		this.setConfigDefaults(tmConfig);

		this.createCsvOnlyForm();

		this.tmsvg = this.mapRootElement.insert("svg")
			.attr("width", this.config.width)
			.attr("height", this.config.height)
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "70 -100 900 500");
		this.svgDefs = this.tmsvg.append("defs");
		this.zoomg = this.tmsvg.append("g").attr("class", "zoomgroup");
		// append a background rectangle so mouse scroll zoom works over sea
		this.zoomg.append("rect")
			.attr("y", "-150")
			.attr("class", "mapocean");

		this.controlg = this.tmsvg.append("g").attr("class", "controlgroup");
		this.tooltipElement = this.mapRootElement.append("div")
			.attr("id", "maptooltip");

		// need to init mapper before arrows otherwise the map is on top of
		// the arrows
		mapper.init(this.zoomg, this.controlg, this.svgDefs, this.config);
		arrows.init(this.tmsvg, this.zoomg, this.svgDefs, '#maptooltip', this.config.arrowColours,
			this.config.minArrowWidth, this.config.maxArrowWidth);

		// set up the various callbacks we need to link things together
		var moduleThis = this;
		csv.init(
			function(csvType, csvData) { moduleThis.csvLoadedCallback(csvType, csvData); },
			function(csvType, csvData, filters) { moduleThis.filterLoadedCallback(csvType, csvData, filters); },
			function(msg) { moduleThis.csvLoadErrorCallback(msg); });

		route.setCountryGetPointFunc(function(countryCode) {return mapper.countryCentrePoint(countryCode);});
		route.setLatLongToPointFunc(function(latLong) {return mapper.latLongToPoint(latLong);});
		filterform.formChangedCallback = function(columnName) {return moduleThis.filterformChangedCallback(columnName); };
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
			if (['plain-arrows', 'spiral-tree'].indexOf(this.queryString.arrowtype) !== -1) {
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

		// work out some stuff from the size of the element we're attached to
		if (!this.config.hasOwnProperty("width")) {
			this.config.width = parseInt(this.mapRootElement.style('width'));
		}
		if (!this.config.hasOwnProperty("height")) {
			this.config.height = this.config.width * this.config.ratio;
		}
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
	},

	createFilterForm: function(filters) {
		// generate the form for playing with the data
		this.filterFormElement.html(filterSkeleton);

		filterform.createFormFromFilters(this.filterFormElement, filters);
	},

	filterLoadedCallback: function(csvType, csvData, filters) {
		this.createFilterForm(filters);
	},

	showFilteredCsv: function() {
		this.showNowWorking();
		arrows.clearTooltip();
		mapper.resetZoom();
		var routes = csv.filterDataAndReturnRoutes(
			this.currentCsvType, this.currentCsvData, filterform.filterValues);
		if (!routes) {
			console.log("failed to get routes");
			return;
		}

		var pointRoles = routes.getPointRoles();
		this.currentUnit = csv.getUnit(this.currentCsvType, filterform.filterValues);
		arrows.currentUnit = this.currentUnit;
		// now draw the routes
		if (this.config.arrowType === "plain-arrows") {
			arrows.drawRouteCollectionPlainArrows(routes, pointRoles);
		} else if (this.config.arrowType === "spiral-tree") {
			arrows.drawRouteCollectionSpiralTree(routes, pointRoles);
		} else {
			console.log("unknown config.arrowType: " + this.config.arrowType);
		}
		arrows.drawLegend();
		// colour in the countries that are trading
		mapper.colorTradingCountries(pointRoles);
		this.stopNowWorking();
	},

	filterformChangedCallback: function(columnName) {
		this.showFilteredCsv();
	},

	csvLoadedCallback: function(csvType, csvData) {
		// first cache the current values, so we can regenerate if we want
		this.currentCsvData = csvData;
		this.currentCsvType = csvType;

		this.showFilteredCsv();
		this.reportCsvLoadErrors();
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
