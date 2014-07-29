/*
 * The main trademapper library
 */
define(
	["trademapper.arrows", "trademapper.csv", "trademapper.mapper",
		"trademapper.route", "d3"],
	function(arrows, csv, mapper, route, d3) {
	"use strict";

	var config, rootElement, fileInputElement, tmsvg,

	init = function(map, fileInput, tmConfig) {
		config = tmConfig || {};
		rootElement = map;
		fileInputElement = fileInput;

		config.ratio = config.ratio || 1.0;
		config.width = parseInt(rootElement.style('width'));
		config.height = config.width * config.ratio;

		tmsvg = rootElement.insert("svg")
			.attr("width", config.width)
			.attr("height", config.height)
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "0 0 " + config.width + " " + config.height);
		arrows.init(tmsvg);
		mapper.init(tmsvg, config);

		csv.init(fileInputElement, csvLoadedCallback);

		route.setCountryGetPointFunc(mapper.countryCentrePoint);
		route.setLatLongToPointFunc(mapper.latLongToPoint);

		//hardWiredTest();
	},

	// hardwired code that will be replaced down the road
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
	};

	return {
		init: init
	};
});
