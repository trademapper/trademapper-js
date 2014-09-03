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
		"d3",
		"text!../fragments/filterskeleton.html",
		"text!../fragments/csvonlyskeleton.html"
	],
	function(arrows, csv, filterform, mapper, route,
			 d3, filterSkeleton, csvOnlySkeleton) {
	"use strict";

	return {
	config: null,
	mapRootElement: null,
	formElement: null,
	tooltipElement: null,
	fileInputElement: null,
	tmsvg: null,
	currentCsvData: null,
	currentCsvType: null,

	defaultConfig: {
			ratio: 0.6,
			arrowColours: {
				pathStart: "black",
				pathEnd: "orange"
			},
			minArrowWidth: 1,
			maxArrowWidth: 30
		},

	init: function(mapId, formElementId, tmConfig) {
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
		this.tmsvg.append("defs");
		this.tooltipElement = this.mapRootElement.append("div")
			.attr("id", "maptooltip");

		arrows.init(this.tmsvg, this.tooltipElement, this.config.arrowColours,
			this.config.minArrowWidth, this.config.maxArrowWidth);
		mapper.init(this.tmsvg, this.config);

		// set up the various callbacks we need to link things together
		var moduleThis = this;
		csv.init(
			function(csvType, csvData) { return moduleThis.csvLoadedCallback(csvType, csvData); },
			function(csvType, csvData, filters) { return moduleThis.filterLoadedCallback(csvType, csvData, filters); },
			function(msg) { return moduleThis.csvLoadErrorCallback(msg); });

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
		this.fileInputElement = this.formElement.select("#fileinput");
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
		// now draw the routes
		arrows.drawRouteCollectionSpiralTree(routes, pointRoles);
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
	},

	csvLoadErrorCallback: function(msg) {
		// TODO: show the error to the user
		console.log(msg);
	}

	};
});
