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
		// jquery and bootstrap
		jquery: "lib/jquery-2.1.1.min",
		bootstrap: "lib/bootstrap.min",
		// map data - jsons imported by require
		countrycentre: "map/countrycentre",
		disputedareas: "map/disputedareas",
		worldmap: "map/worldmap"
	},
	shim: {
		bootstrap: {
			deps: ["jquery"]
		}
	}
});

// once loaded, get to work
require(["trademapper", "bootstrap", "domReady!"], function(tm) {
	"use strict";
	var config = {width:1600, arrowType:"plain-arrows"};
	tm.init("#trademapper", "#tm-file-select", "#form-filters", config);
});
