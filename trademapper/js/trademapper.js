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
		"text!../fragments/csvonlyskeleton.html"
	],
	function(arrows, csv, filterform, mapper, route, util,
			 d3, filterSkeleton, csvOnlySkeleton) {
	"use strict";

	return {
	config: null,
	mapRootElement: null,
	formElement: null,
	tooltipElement: null,
	fileInputElement: null,
	tmsvg: null,
	svgDefs: null,
	zoomg: null,
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

	init: function(mapId, formElementId, tmConfig) {
		this.queryString = util.queryString();
		this.mapRootElement = d3.select(mapId);
		this.formElement = d3.select(formElementId);
		this.setConfigDefaults(tmConfig);

		this.createCsvOnlyForm();

		this.tmsvg = this.mapRootElement.insert("svg")
			.attr("width", this.config.width)
			.attr("height", this.config.height)
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "0 -30 1500 700");
		this.svgDefs = this.tmsvg.append("defs");
		this.zoomg = this.tmsvg.append("g").attr("class", "zoomgroup");
		this.tooltipElement = this.mapRootElement.append("div")
			.attr("id", "maptooltip");

		arrows.init(this.tmsvg, '#maptooltip', this.config.arrowColours,
			this.config.minArrowWidth, this.config.maxArrowWidth);
		mapper.init(this.zoomg, this.svgDefs, this.config);

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
		this.formElement.html(csvOnlySkeleton);
		this.fileInputElement = this.formElement.select("#fileinput");
		csv.setFileInputElement(this.fileInputElement);
	},

	createFilterForm: function(filters) {
		// generate the form for playing with the data
		this.formElement.html(filterSkeleton + csvOnlySkeleton);
		var fileInput = document.querySelector(".filters-group.group-fileinput > p > input#fileinput");
		var fileInputParent = fileInput.parentNode;
		fileInputParent.removeChild(fileInput);
		fileInputParent.appendChild(this.fileInputElement[0][0]);
		csv.setFileInputElement(this.fileInputElement);

		filterform.createFormFromFilters(this.formElement, filters);
	},

	filterLoadedCallback: function(csvType, csvData, filters) {
		this.createFilterForm(filters);
	},

	showFilteredCsv: function() {
		this.showNowWorking();
		arrows.clearTooltip();
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
