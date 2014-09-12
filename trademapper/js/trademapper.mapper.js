
define(["d3", "topojson", "worldmap", "disputedareas", "countrycentre"], function(d3, topojson, mapdata, disputedareas, countryCentre) {
	"use strict";

	return {

	zoomg: null,
	mapg: null,
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
	init: function(svgZoomg, svgDefs, mapConfig) {
		this.zoomg = svgZoomg;
		this.svgDefs = svgDefs;
		this.config = mapConfig;

		this.addPatternDefs();

		this.projection = d3.geo.mercator();
			//.scale(mapWidth/1.25)
			//.translate([mapWidth/4, mapHeight/2+10]);
		this.pathmaker = d3.geo.path().projection(this.projection);

		this.countries = topojson.feature(mapdata, mapdata.objects.subunits).features;
		this.borders = topojson.mesh(mapdata, mapdata.objects.subunits,
			function(a, b) { return true; });
		this.disputed = topojson.feature(disputedareas, disputedareas.objects.disputeunit).features;
		this.disputedborders = topojson.mesh(disputedareas, disputedareas.objects.disputeunit,
			function(a, b) { return true; });

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

		this.mapg.append("path")
			.datum(this.disputedborders)
			.attr("d", this.pathmaker)
			.attr("class", "disputed-border");

		var moduleThis = this,
		zoomed = function() {
			// TODO: put map in group so it can be zoomed separate to legend etc
			moduleThis.mapg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		},
		zoom = d3.behavior.zoom()
			//.scaleExtent([1, 10])
			.on("zoom", zoomed);
		this.zoomg.call(zoom);
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
