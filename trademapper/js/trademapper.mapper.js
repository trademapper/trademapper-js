
define(["d3", "topojson", "worldmap", "disputedareas", "countrycentre"], function(d3, topojson, mapdata, disputedareas, countryCentre) {
	"use strict";

	return {

	zoomg: null,
	mapg: null,
	controlg: null,
	svgDefs: null,
	config: null,
	countries: null,
	borders: null,
	disputed: null,
	disputedborders: null,
	projection: null,
	pathmaker: null,

	/*
	 * caches svg reference
	 * decodes countries and borders and draws them
	 */
	init: function(svgZoomg, controlg, svgDefs, mapConfig) {
		this.zoomg = svgZoomg;
		this.controlg = controlg;
		this.svgDefs = svgDefs;
		this.config = mapConfig;

		this.addPatternDefs();
		this.drawMap();
		this.setupZoom();
	},

	drawMap: function() {
		this.projection = d3.geo.mercator();
			//.scale(mapWidth/1.25)
			//.translate([mapWidth/4, mapHeight/2+10]);
		this.pathmaker = d3.geo.path().projection(this.projection);

		this.countries = topojson.feature(mapdata, mapdata.objects.subunits).features;
		this.borders = topojson.mesh(mapdata, mapdata.objects.subunits,
			function(a, b) { return true; });
		this.disputed = topojson.feature(disputedareas, disputedareas.objects.disputeunit).features;
		// don't need to draw disputed borders
		/*this.disputedborders = topojson.mesh(disputedareas, disputedareas.objects.disputeunit,
			function(a, b) { return true; });*/

		this.mapg = this.zoomg.append("g")
			.attr("class", "mapgroup");

		this.mapg.selectAll(".subunit")
			.data(this.countries)
			.enter()
				.append("path")
				.attr("d", this.pathmaker)
				.attr("class", function(d) { return "country " + d.id; });
				//.on("click", countryClicked)
				//.on("mouseover", hoverCountry)
				//.on("mouseout", unhoverCountry);

		this.mapg.append("path")
			.datum(this.borders)
			.attr("d", this.pathmaker)
			.attr("class", "country-border");

		this.mapg.selectAll(".disputed")
			.data(this.disputed)
			.enter()
				.append("path")
				.attr("d", this.pathmaker)
				.attr("class", function(d) { return "disputed " + d.id; })
				.attr("fill", "url(#diagonalHatch)");

		// don't need to draw disputed borders
		/*this.mapg.append("path")
			.datum(this.disputedborders)
			.attr("d", this.pathmaker)
			.attr("class", "disputed-border");*/
	},

	setupZoom: function() {
		var moduleThis = this,
		zoomed = function() {
			// TODO: put map in group so it can be zoomed separate to legend etc
			moduleThis.zoomg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
			d3.selectAll(".country-border").attr("stroke-width", (1/d3.event.scale).toString());
			// change the width of the paths after zoom
			d3.selectAll(".zoompath").each(function(d, i) {
				this.setAttribute(
					"stroke-width",
					(this.attributes["data-origwidth"].value/d3.event.scale).toString());
			});
		},
		zoom = d3.behavior.zoom()
			.translate([0, 0])
			.scale(1)
			.scaleExtent([1, 20])
			.on("zoom", zoomed);
		this.zoomg.call(zoom);

		// and add some controls to allow zooming - html or svg?
		// add + and - text bits, function to change the scale thing
	},

	resetZoom: function () {
		this.zoomg.attr("transform", "");
	},

	addPatternDefs: function() {
		// from http://stackoverflow.com/a/14500054/3189
		this.svgDefs.append("pattern")
				.attr("id", "diagonalHatch")
				.attr("patternUnits", "userSpaceOnUse")
				.attr("width", "4")
				.attr("height", "4")
			.append("g")
				.attr("class", "diagonal-hatch-path")
			.append("path")
				.attr("d", "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2");
	},

	countryCentrePoint: function(countryCode) {
		if (countryCentre.hasOwnProperty(countryCode)) {
			var latitude = countryCentre[countryCode].latitude,
				longitude = countryCentre[countryCode].longitude;
			return this.projection([longitude, latitude]);
		}
	},

	colorTradingCountries: function(countryObj) {
		this.mapg.selectAll(".country")
			.classed("trading", function(d) {
				if (countryObj.hasOwnProperty(d.id)) {
					return true;
				} else {
					return false;
				}
			});
	},

	resetCountryColors: function() {
		this.mapg.selectAll(".country")
			.classed("trading", false);
	},

	/*
	 * Projects forward from spherical coordinates (in degrees) to Cartesian
	 * coordinates (in pixels)
	 *
	 * Returns an array [x, y] given the input array [longitude, latitude].
	 *
	 * May return null if the specified location has no defined projected
	 * position, such as when the location is outside the clipping bounds of
	 * the projection.
	 */
	latLongToPoint: function(latLong) {
		// TODO: test this actually does what I expect ...
		return this.projection(latLong);
	}

	// TODO:
	// * highlight country - border outline when country hovered/clicked on ...
	// * clear country highlights
	// * chloropeth/ colour countries

	};
});
