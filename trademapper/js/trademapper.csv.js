
define(['d3', 'trademapper.route'], function(d3, route) {
	"use strict";
	return {
		// these are intended to be set at init time
		fileInputElement: null,
		csvFileLoadedCallback: null,
		errorCallback: null,

		initFileInput: function() {
			if (this.fileInputElement !== null) {
				this.fileInputElement.addEventListener('change', this.loadCSVFile);
			}
		},

		loadCSVFile: function() {
			var file = this.fileInputElement.files[0];
			var csvType = "cites";

			if (file.type === "text/csv" ||
					file.type === "text/comma-separated-values") {
				var reader = new FileReader();
				reader.onload = function(e) {
					this.processCSVString(reader.result, csvType);
				};
				reader.readAsText(file);
			} else {
				this.errorCallback("File needs to be a CSV file");
			}
		},

		/*
		 * make a RouteCollection from a CSV string
		 */
		processCSVString: function(fileText, csvType) {
			var csvData = d3.csv.parse(fileText);
			// do different things for different formats: CITES etc
			this.processParsedCSV(csvData, csvType);
		},

		processCSVURL: function(url, csvType) {
			d3.csv(url, null, function(csvData) {
				// do different things for different formats: CITES etc
				this.processParsedCSV(csvData, csvType);
			});
		},

		processParsedCSV: function(csvData, csvType) {
			var csvProcessors = {
				cites: this.processCitesCsv
			};
			if (csvProcessors.hasOwnProperty(csvType)) {
				csvProcessors[csvType](csvData);
			} else {
				this.errorCallback("unknown csvType: " + csvType);
			}
		},

		processCitesCsv: function(csvData) {
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

			// now send back to the callback
			this.csvFileLoadedCallback(routes);
		}
	};
});
