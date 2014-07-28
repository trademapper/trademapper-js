/*
 * The main trademapper library
 */
define(
	["trademapper.mapper", "trademapper.arrows", "trademapper.route", "d3"],
	function(mapper, arrows, route, d3) {

	var config, rootElement,

	init = function(element, tmConfig) {
		config = tmConfig || {};
		rootElement = element;

		config.ratio = config.ratio || 1.0;
		config.width = parseInt(element.style('width'));
		config.height = config.width * config.ratio;

		tmsvg = element.insert("svg")
			.attr("width", config.width)
			.attr("height", config.height)
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "0 0 " + config.width + " " + config.height);
		mapper.init(tmsvg, config);

		route.setCountryGetLatLongFunc(mapper.countryCentrePoint);
		route.setLatLongToPointFunc(mapper.latLongToPoint);
	};

	return {
		init: init
	};
});
