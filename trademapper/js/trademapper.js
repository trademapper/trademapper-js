/*
 * The main trademapper library
 */
define(
	["trademapper.arrows", "trademapper.csv", "trademapper.mapper",
		"trademapper.route", "d3"],
	function(arrows, csv, mapper, route, d3) {
	"use strict";

	var config, rootElement, fileInputElement, tmsvg,

		defaultConfig = {
			ratio: 0.6,
			arrowColours: {
				pathStart: "black",
				pathEnd: "orange"
			},
			maxArrowWidth: 30
		},

	init = function(map, fileInput, tmConfig) {
		rootElement = map;
		fileInputElement = fileInput;
		setConfigDefaults(tmConfig);

		tmsvg = rootElement.insert("svg")
			.attr("width", config.width)
			.attr("height", config.height)
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "0 0 " + config.width + " " + config.height);
		arrows.init(tmsvg, config.arrowColours, config.maxArrowWidth);
		mapper.init(tmsvg, config);

		csv.init(fileInputElement, csvLoadedCallback, csvLoadErrorCallback);

		route.setCountryGetPointFunc(mapper.countryCentrePoint);
		route.setLatLongToPointFunc(mapper.latLongToPoint);

		// TODO: delete when happy to do so
		//hardWiredTest();
	},

	setConfigToDefaultIfNotSet = function(key) {
		config[key] = config[key] || defaultConfig[key];
	},

	setConfigDefaults = function(tmConfig) {
		config = tmConfig || {};

		setConfigToDefaultIfNotSet("ratio");
		setConfigToDefaultIfNotSet("arrowColours");

		config.width = parseInt(rootElement.style('width'));
		config.height = config.width * config.ratio;
	},

	// hardwired code that will be replaced down the road
	// TODO: delete this
	hardWiredTest = function() {

		routes = [
			new route.Route([
				new route.PointCountry("IN"),
				new route.PointCountry("CN")
			], 2),
			new route.Route([
				new route.PointCountry("KE"),
				new route.PointCountry("US"),
				new route.PointCountry("GB")
			], 20),
			new route.Route([
				new route.PointCountry("AU"),
				new route.PointCountry("ET"),
				new route.PointCountry("FR")
			], 10)
		];
		arrows.drawMultipleRoutes(routes);
	},

	csvLoadedCallback = function(routes) {
		arrows.drawRouteCollection(routes);
	},

	csvLoadErrorCallback = function(msg) {
		// TODO: show the error to the user
	};

	return {
		init: init
	};
});
