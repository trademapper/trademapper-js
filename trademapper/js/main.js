require.config({
	baseUrl: 'js',
	paths: {
		d3: "d3/d3",
		topojson: "d3/topojson.v1"
	}
});

// once loaded, get to work
require(["d3", "trademapper", "domReady!"], function(d3, tm, doc) {
	"use strict";
	var config = {width:1600, arrowType:"plain-arrows"};
	tm.init("#trademapper", "#tm-file-select", "#form-filters", config);
});
