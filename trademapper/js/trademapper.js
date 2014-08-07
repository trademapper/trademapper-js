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

	var config, mapRootElement, formElement, tooltipElement, fileInputElement,
		tmsvg, currentCsvData, currentCsvType,

		defaultConfig = {
			ratio: 0.6,
			arrowColours: {
				pathStart: "black",
				pathEnd: "orange"
			},
			minArrowWidth: 1,
			maxArrowWidth: 30
		},

	init = function(mapId, formElementId, tmConfig) {
		mapRootElement = d3.select(mapId);
		formElement = d3.select(formElementId);
		setConfigDefaults(tmConfig);

		createCsvOnlyForm();

		tmsvg = mapRootElement.insert("svg")
			.attr("width", config.width)
			.attr("height", config.height)
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "0 -30 1500 700");
		tooltipElement = mapRootElement.append("div")
			.attr("id", "maptooltip");

		arrows.init(tmsvg, tooltipElement, config.arrowColours, config.minArrowWidth, config.maxArrowWidth);
		mapper.init(tmsvg, config);

		// set up the various callbacks we need to link things together
		csv.init(csvLoadedCallback, filterLoadedCallback, csvLoadErrorCallback);

		route.setCountryGetPointFunc(mapper.countryCentrePoint);
		route.setLatLongToPointFunc(mapper.latLongToPoint);
		filterform.formChangedCallback = filterformChangedCallback;
	},

	setConfigDefaults = function(tmConfig) {
		config = tmConfig || {};

		// set defaults for all
		Object.keys(defaultConfig).forEach(function(key) {
			config[key] = config[key] || defaultConfig[key];
		});

		// work out some stuff from the size of the element we're attached to
		if (!config.hasOwnProperty("width")) {
			config.width = parseInt(mapRootElement.style('width'));
		}
		if (!config.hasOwnProperty("height")) {
			config.height = config.width * config.ratio;
		}
	},

	showNowWorking = function() {
		console.log("start working");
	},

	stopNowWorking = function() {
		console.log("work finished");
	},

	createCsvOnlyForm = function() {
		formElement.html(csvOnlySkeleton);
		fileInputElement = formElement.select("#fileinput");
		csv.setFileInputElement(fileInputElement);
	},

	createFilterForm = function(filters) {
		// generate the form for playing with the data
		formElement.html(filterSkeleton + csvOnlySkeleton);
		fileInputElement = formElement.select("#fileinput");
		csv.setFileInputElement(fileInputElement);

		filterform.createFormFromFilters(formElement, filters);
	},

	filterLoadedCallback = function(csvType, csvData, filters) {
		createFilterForm(filters);
	},

	showFilteredCsv = function() {
		showNowWorking();
		var routes = csv.filterDataAndReturnRoutes(
			currentCsvType, currentCsvData, filterform.filterValues);
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
		stopNowWorking();
	},

	filterformChangedCallback = function(columnName) {
		showFilteredCsv();
	},

	csvLoadedCallback = function(csvType, csvData) {
		// first cache the current values, so we can regenerate if we want
		currentCsvData = csvData;
		currentCsvType = csvType;

		showFilteredCsv();
	},

	csvLoadErrorCallback = function(msg) {
		// TODO: show the error to the user
		console.log(msg);
	};

	return {
		init: init
	};
});
