/*
 * The main trademapper library
 */
define(["trademapper.mapper", "d3"], function(mapper, d3) {
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
	};

	return {
		init: init
	};
});
