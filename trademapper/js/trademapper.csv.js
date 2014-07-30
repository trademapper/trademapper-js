
define(['d3', 'trademapper.route'], function(d3, route) {
	"use strict";
	var fileInputElement,
		csvFileLoadedCallback, errorCallback,
		filename = '/home/hamish/dev/wwftrademapper/trademapper-js/tests/data/Ivory_tiny.csv',

	init = function(fileInput, success_callback, error_callback) {
		fileInputElement = fileInput;
		csvFileLoadedCallback = success_callback;
		errorCallback = error_callback;
		if (fileInputElement !== null) {
			fileInputElement.addEventListener('change', loadCSVFile);
		}
	},

	loadCSVFile = function() {
		var file = fileInputElement.files[0];
		var csvType = "cites";

		if (file.type == 'text/csv' ||
				file.type == 'text/comma-separated-values') {
			var reader = new FileReader();
			reader.onload = function(e) {
				processCSVString(reader.result, csvType);
			};
			reader.readAsText(file);
		} else {
			console.log("File needs to be a CSV file");
		}
	},

	/*
	 * make a RouteCollection from a CSV string
	 */
	processCSVString = function(fileText, csvType) {
		var csvData = d3.csv.parse(fileText);
		// do different things for different formats: CITES etc
		processParsedCSV(csvData, csvType);
	},

	processCSVURL = function(url, csvType) {
		d3.csv(url, null, function(csvData) {
			// do different things for different formats: CITES etc
			processParsedCSV(csvData, csvType);
		});
	},

	processParsedCSV = function(csvData, csvType) {
		if (csvProcessors.hasOwnProperty(csvType)) {
			csvProcessors[csvType](csvData);
		} else {
			errorCallback("unknown csvType: " + csvType);
		}
	},

	processCitesCsv = function(csvData) {
		var routes, points, origin, importer, exporter, importer_quantity,
			exporter_quantity, weight, row,

		// the header of the CITES CSV is:
		// Year,App.,Family,Taxon,Importer,Exporter,Origin,Importer reported quantity,Exporter reported quantity,Term,Unit,Purpose,Source
		IMPORTER_INDEX = "Importer",
		EXPORTER_INDEX = "Exporter",
		ORIGIN_INDEX = "Origin",
		IMPORTER_QUANTITY_INDEX = "Importer reported quantity",
		EXPORTER_QUANTITY_INDEX = "Exporter reported quantity";

		routes = new route.RouteCollection();
		for (var i = 0; i < csvData.length; i++) {
			row = csvData[i];
			origin = row[ORIGIN_INDEX];
			importer = row[IMPORTER_INDEX];
			exporter = row[EXPORTER_INDEX];
			importer_quantity = row[IMPORTER_QUANTITY_INDEX];
			exporter_quantity = row[EXPORTER_QUANTITY_INDEX];
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
			routes.addRoute(new route.Route(points, weight));
		}
		console.log(routes);

		// now send back to the callback
		csvFileLoadedCallback(routes);
	},

	csvProcessors = {
		cites: processCitesCsv
	};

	return {
		init: init,
		processCSVString: processCSVString
	};
});
