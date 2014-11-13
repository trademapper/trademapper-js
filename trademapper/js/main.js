require.config({
	baseUrl: 'js',
	paths: {
		// require.js bits
		domReady: "lib/domReady",
		text: "lib/text",
		// d3 bits
		d3: "lib/d3",
		queue: "lib/queue.v1",
		topojson: "lib/topojson.v1",
		// map data - jsons imported by require
		countrycentre: "map/countrycentre",
		disputedareas: "map/disputedareas",
		worldmap: "map/worldmap"
	}
});

// once loaded, get to work
require(["d3", "trademapper", "domReady!"], function(d3, tm, doc) {
	"use strict";
	var config = {width:1600, arrowType:"plain-arrows"};
	tm.init("#trademapper", "#tm-file-select", "#form-filters", config);
});
