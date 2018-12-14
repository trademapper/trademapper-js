define(["d3", "topojson", "vendor/doT", "worldmap", "disputedareas", "countrycentre", "trademapper.portlookup", "config", "util", "text!../fragments/svgstyles.css"], function(d3, topojson, doT, mapdata, disputedareas, countryCentre, portlookup, config, util, svgStylesTemplate) {
	"use strict";

	return {

	zoomg: null,
	mapg: null,
	controlg: null,
	svgDefs: null,
	config: null,
	svg: null,
	countries: null,
	countryCodeToName: null,
	countryCodeToInfo: null,
	borders: null,
	disputed: null,
	disputedborders: null,
	projection: null,
	pathmaker: null,
	width: 960,
	height: 400,

	/*
	 * caches svg reference
	 * decodes countries and borders and draws them
	 */
	init: function(svgZoomg, controlg, svgDefs, mapConfig, svg) {
		this.projection = d3.geoMercator();
		this.pathmaker = d3.geoPath().projection(this.projection).pointRadius(1);

		this.zoomg = svgZoomg;
		this.mapg = this.zoomg.append("g").attr("class", "mapgroup");

		this.controlg = controlg;
		this.svgDefs = svgDefs;
		this.config = mapConfig;
		this.svg = svg;
		this.width = mapConfig.width || 960;
		this.height = mapConfig.height || 400;
		this.addPatternDefs();
		this.drawMap();
		this.setupZoom();
		this.makeCountryNameHash();

		this.setStyles();
	},

	// layers have custom colours which can be set by the user;
	// these are stored in the config object in the styles.LAYER_COLOURS map,
	// where the keys are the layer IDs; these then become part of CSS
	// selectors produced via the fragments/svgstyles.css template, which in
	// turn style the SVG elements
	setLayerColour: function (layerId, colour) {
		this.config.styles.LAYER_COLOURS[layerId] = colour;
		this.setStyles();
	},

	// SVG styling, via a template with settings from config;
	// must be inserted as first child for the styling to work in the standalone SVG
	setStyles: function () {
		var style = this.svg.select("style#configured-styles");
		if (style.size() === 0) {
			style = this.svg.insert("style", ":first-child").attr("id", "configured-styles");
		}

		var svgStyles = doT.template(svgStylesTemplate)(this.config.styles);
		style.text(svgStyles);
	},

	makeCountryNameHash: function() {
		/* CITES uses some non-ISO codes for location, starting with X.
		Source: http://trade.cites.org/cites_trade_guidelines/en-CITES_Trade_Database_Guide.pdf
		*/
		var nameHash = {
			"XA": "French Antilles",
			"XC": "Caribbean",
			"XE": "Europe",
			"XF": "Africa",
			"XM": "South America",
			"XS": "Asia",
			"XV": "Various",
			"XX": "Unknown"
		};
		var infoHash = {};
		this.countries.forEach(function(e) {
			nameHash[e.id] = e.properties.name;
			infoHash[e.id] = {
				name: e.properties.name,
				formal_en: e.properties.formal_en,
				region_un: e.properties.region_un,
				region_wb: e.properties.region_wb
			};
		});
		this.countryCodeToName = nameHash;
		this.countryCodeToInfo = infoHash;
	},

	drawMap: function() {
		this.countries = topojson.feature(mapdata, mapdata.objects.subunits).features;

		this.borders = topojson.mesh(mapdata, mapdata.objects.subunits,
			function(a, b) { return true; });

		this.disputed = topojson.feature(disputedareas, disputedareas.objects.disputeunit).features;
		// don't need to draw disputed borders
		/*this.disputedborders = topojson.mesh(disputedareas, disputedareas.objects.disputeunit,
			function(a, b) { return true; });*/

		this.mapg.selectAll(".subunit")
			.data(this.countries)
			.enter()
				.append("path")
				.attr("d", this.pathmaker)
				.attr("class", function(d) { return "country " + d.id; });

		this.mapg.append("path")
			.datum(this.borders)
			.attr("d", this.pathmaker)
			.attr("class", "country-border");

		this.mapg.selectAll(".disputed")
			.data(this.disputed)
			.enter()
				.append("path")
				.attr("d", this.pathmaker)
				.attr("class", function(d) { return "disputed " + d.id; });
	},

	// layer: a Layer object (see trademapper.layerloader.js)
	// layers are drawn using the data in the Layer, using the colour from the
	// Layer; each element added from the data in this layer is assigned a
	// "unique" ID from the layer
	// callback: function invoked with no args when SVG is in the DOM
	loadTopoJSON: function (layer, callback) {
		var layerId = layer.id;
		var data = layer.data;

		this.setLayerColour(layerId, layer.colour);

		// polygons need drawing with class layer-poly;
		// lines need drawing with class layer-line;
		// points need drawing with class layer-point
		var polygons = {
			type: "GeometryCollection",
			geometries: []
		};

		var lines = {
			type: "GeometryCollection",
			geometries: []
		};

		var points = {
			type: "GeometryCollection",
			geometries: []
		};

		// sort the geometries so they can be drawn appropriately
		var geometries, i, geometry;
		for (var propertyName in data.objects) {
			geometries = data.objects[propertyName].geometries;

			for (i = 0; i < geometries.length; i++) {
				var geometry = geometries[i];

				if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
					polygons.geometries.push(geometry);
				} else if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
					lines.geometries.push(geometry);
				} else if (geometry.type === "Point" || geometry.type === "MultiPoint") {
					points.geometries.push(geometry);
				}
			}
		}

		// polygons
		if (polygons.geometries.length > 0) {
			var polygonFeatures = topojson.feature(data, polygons).features;

			this.mapg.selectAll("." + layerId + " layer-poly")
				.data(polygonFeatures)
				.enter()
					.append("path")
					.attr("d", this.pathmaker)
					.attr("class", layerId + " layer-poly");

			// extract lines around polygons; this creates a multiline which draws
			// around the polygons and shows their borders
			var boundaries = topojson.mesh(data, polygons, function(a, b) { return a !== b; });
			this.mapg.append("path")
				.datum(boundaries)
				.attr("d", this.pathmaker)
				.attr("class", layerId + " layer-boundary");
		}

		// points
		if (points.geometries.length > 0) {
			var pointFeatures = topojson.feature(data, points).features;
			this.mapg.selectAll("." + layerId + " layer-point")
				.data(pointFeatures)
				.enter()
					.append("path")
					.attr("d", this.pathmaker)
					.attr("class", layerId + " layer-point");
		}

		// lines
		if (lines.geometries.length > 0) {
			var lineFeatures = topojson.feature(data, lines).features;
			this.mapg.selectAll("." + layerId + " layer-line")
				.data(lineFeatures)
				.enter()
					.append("path")
					.attr("d", this.pathmaker)
					.attr("class", layerId + " layer-line");
		}

		console.log("loaded topojson");

		if (callback) {
			callback();
		}
	},

	setupZoom: function() {
		var moduleThis = this,
		zoomed = function() {
			var translate = [d3.event.transform.x, d3.event.transform.y];
			var scale = d3.event.transform.k;

			moduleThis.zoomg.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
			d3.selectAll(".country-border").attr("stroke-width", (1/scale).toString());
			// change the width of the paths after zoom
			d3.selectAll(".zoompath").each(function(d, i) {
				this.setAttribute(
					"stroke-width",
					(this.attributes["data-origwidth"].value/scale).toString());
			});
			d3.selectAll(".zoomgroup circle.tradenode").each(function(d, i) {
				this.setAttribute(
					"r",
					(this.attributes["data-orig-r"].value/scale).toString());
			});
		},
		zoom = d3.zoom()
			.scaleExtent([0.5, 20])
			.on("zoom", zoomed);

		this.svg.call(zoom);

		// and add some controls to allow zooming - html or svg?
		// add + and - text bits, function to change the scale thing
	},

	resetZoom: function () {
		this.zoomg.attr("transform", "");
	},
		/* Return the extent as a bounding array as per https://github.com/mbostock/d3/wiki/Geo-Paths#bounds
				[0][0], [0][1],	 [1][0],	[1][1]
				[​[left, bottom], [right, top]​] */
	findExtent: function(countriesObj) {
			var extent= [[],[]];
			/* [​[left, bottom], [right, top]​] */
			for (var prop in countriesObj) {
					if (countriesObj.hasOwnProperty(prop)) {
							var country = countriesObj[prop];
							if(country.hasOwnProperty('point')) {
									extent[0][0] = extent[0][0] ? Math.min(extent[0][0], country.point[0]) : country.point[0] ;
									extent[0][1] = extent[0][1] ? Math.min(extent[0][1], country.point[1]) : country.point[1] ;
									extent[1][0] = extent[1][0] ? Math.max(extent[1][0], country.point[0]) : country.point[0] ;
									extent[1][1] = extent[1][1] ? Math.max(extent[1][1], country.point[1]) : country.point[1] ;
							}
					}
			}
			return extent;
	},

	zoomToShow: function(countriesObj) {
			var extent = this.findExtent(countriesObj);
			// Define the new view's center, width and height.
			var c_new = [ (extent[0][0]+extent[1][0]) /2,
																	(extent[0][1]+extent[1][1]) /2],
							width_new = extent[1][0] - extent[0][0],
					  height_new = extent[1][1] - extent[0][1],

							// 80% just for a bit of a margin
							scale = .8 * 1/ Math.max( width_new/this.width, height_new/this.height),
							translate = [this.width/2 - scale*c_new[0],
																				this.height/2 - scale*c_new[1]];

			this.zoomg.transition()
					.duration(750)
					.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
	},

	addPatternDefs: function() {
		// from http://stackoverflow.com/a/14500054/3189
		this.svgDefs.append("pattern")
				.attr("id", "diagonalHatch")
				.attr("patternUnits", "userSpaceOnUse")
				.attr("width", "4")
				.attr("height", "4")
			.append("g")
				.attr("stroke", config.styles["DISPUTED"])
				.attr("stroke-width", "0.25px")
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

	portCentrePoint: function(portCode) {
		var port = portlookup.getPortDetails(portCode);
		if (port) {
			return this.projection([port.lon, port.lat]);
		}
	},

	setTradingCountries: function(countriesObj) {
		this.mapg.selectAll(".country")
			.classed("trading", function(d, idx, nodes) {
				if (countriesObj.hasOwnProperty(d.id)) {
					return true;
				} else {
					return false;
				}
			});
	},

	resetTradingCountries: function() {
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
