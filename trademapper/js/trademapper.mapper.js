
define(["d3", "topojson", "worldmap"], function(d3, topojson, mapdata) {
	var mapsvg, config,
		countries, borders,
		pathmaker,

	init = function(svgElement, mapConfig) {
		mapsvg = svgElement;

		var projection = d3.geo.mercator();
			//.scale(mapWidth/1.25)
			//.translate([mapWidth/4, mapHeight/2+10]);
		pathmaker = d3.geo.path().projection(projection);

		countries = topojson.feature(mapdata, mapdata.objects.subunits).features;
		borders = topojson.mesh(mapdata, mapdata.objects.subunits,
			function(a, b) { return true; });

		mapsvg.selectAll(".subunit")
			.data(countries)
			.enter()
				.append("path")
				.attr("d", pathmaker)
				.attr("class", function(d) { return "country " + d.id; });
				//.on("click", countryClicked)
				//.on("mouseover", hoverCountry)
				//.on("mouseout", unhoverCountry);

		mapsvg.append("path")
			.datum(borders)
			.attr("d", pathmaker)
			.attr("class", "country-border");
	},

	countryCentrePoint = function(countryCode) {
		for (var i = 0; i < countries.length; i++) {
			if (countries[i].id === countryCode) {
				return pathmaker.centroid(countries[i]);
			}
	}
	};

	return {
		init: init,
		countryCentrePoint: countryCentrePoint
	};
});
