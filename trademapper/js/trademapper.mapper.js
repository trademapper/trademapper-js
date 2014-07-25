
define(["d3", "topojson", "worldmap"], function(d3, topojson, mapdata) {
	var mapsvg, mapWidth, mapHeight, config, pathmaker,

	init = function(element, mapConfig) {
		mapWidth = parseInt(element.style('width'));
		mapHeight = mapWidth * mapConfig.ratio;

		var projection = d3.geo.mercator();
			//.scale(mapWidth/1.25)
			//.translate([mapWidth/4, mapHeight/2+10]);
		pathmaker = d3.geo.path().projection(projection);
		mapsvg = element.insert("svg")
			.attr("width", mapWidth)
			.attr("height", mapHeight)
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "0 0 " + mapWidth + " " + mapHeight);

		var countries = topojson.feature(mapdata, mapdata.objects.subunits).features;
		var borders = topojson.mesh(mapdata, mapdata.objects.subunits,
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
	};

	return {
		init: init
	};
});
