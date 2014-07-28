
define(['d3', 'trademapper.route'], function(d3, route) {
	var fileInputElement,
		csvFileLoadedCallback,
		filename = '/home/hamish/dev/wwftrademapper/trademapper-js/tests/data/Ivory_tiny.csv',

		// TODO: move into a CITES specific version at some point
		IMPORTER_INDEX = 4,
		EXPORTER_INDEX = 5,
		ORIGIN_INDEX = 6,
		IMPORTER_QUANTITY_INDEX = 7,
		EXPORTER_QUANTITY_INDEX = 8,

	init = function(fileInput, callback) {
		fileInputElement = fileInput;
		csvFileLoadedCallback = callback;
		fileInputElement.addEventListener('change', loadCSVFile);
	},
	
	loadCSVFile = function() {
		var file = fileInputElement.files[0];

		if (file.type == 'text/csv' ||
				file.type == 'text/comma-separated-values') {
			var reader = new FileReader();
			reader.onload = function(e) {
				processCSVFile(reader.result);
			};
			reader.readAsText(file);
		} else {
			console.log("File needs to be a CSV file");
		}
	},
	
	processCSVFile = function(fileText) {
		var routes, points, origin, importer, exporter, importer_quantity,
			exporter_quantity, weight, csvData;

		csvData = d3.csv.parseRows(fileText);
		// make routes from CSV
		// TODO: do different things for different formats
		console.log(csvData.length + " lines in CSV file");

		routes = [];
		// we start at 1 to skip the title row
		for (var i = 1; i < csvData.length; i++) {
			origin = csvData[i][ORIGIN_INDEX];
			importer = csvData[i][IMPORTER_INDEX];
			exporter = csvData[i][EXPORTER_INDEX];
			importer_quantity = csvData[i][IMPORTER_QUANTITY_INDEX];
			exporter_quantity = csvData[i][EXPORTER_QUANTITY_INDEX];
			weight = Math.max(importer_quantity, exporter_quantity);

			points = [];
			if (origin.length == 2 && origin != 'XX') {
				points.push(new route.PointCountry(origin));
			}
			if (exporter.length == 2 && exporter != 'XX') {
				points.push(new route.PointCountry(exporter));
			}
			if (importer.length == 2 && importer != 'XX') {
				points.push(new route.PointCountry(importer));
			}
			// only add a route if it has at least 2 points
			if (points.length >= 2) {
				routes.push(new route.Route(points, weight));
			}
		}
		console.log(routes);

		// now send back to the callback
		csvFileLoadedCallback(routes);
	};

	return {
		init: init
	};
});
