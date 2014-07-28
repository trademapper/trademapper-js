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
		arrows.init(tmsvg);
		mapper.init(tmsvg, config);

		route.setCountryGetPointFunc(mapper.countryCentrePoint);
		route.setLatLongToPointFunc(mapper.latLongToPoint);

		// Below this point is hardwired code that will be replaced down the road
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
		for (var i = 0; i < routes.length; i++) {
			arrows.drawRoute(routes[i]);
		}
	};

	return {
		init: init
	};
});
