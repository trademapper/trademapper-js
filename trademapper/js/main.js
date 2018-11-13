require.config({
	baseUrl: 'js',
	paths: {
		// require.js bits
		domReady: "lib/domReady",
		text: "lib/text",
		// d3 bits
		d3: "lib/d3.min",
		queue: "lib/queue.v1",
		topojson: "lib/topojson.v3.0.2.min",
		// jquery and bootstrap
		jquery: "lib/jquery-3.3.1.min",
		bootstrap: "lib/bootstrap.min",
		"bootstrap-switch": "lib/bootstrap-switch.min",
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
	var config = {arrowType:"plain-arrows"};
	tm.init("#trademapper", "#tm-file-select", "#form-filters",
			'#change-over-time', config);
});
