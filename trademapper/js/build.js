({
    baseUrl: ".",
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
    },
    name: "main",
    out: "main-built.js",
	optimizeAllPluginResources: true
})
