/*
 * The main trademapper library
 */
define(["trademapper.mapper", "d3"], function(mapper, d3) {
	var config, rootElement,

	init = function(element, tmConfig) {
		config = tmConfig;
		rootElement = element;
		mapper.init(element, {ratio: 1.0});
	};

	return {
		init: init
	};
});
