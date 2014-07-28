
define(['d3', 'trademapper.route'], function(d3, route) {
	var fileInputElement,
		csvFileLoadedCallback,
		filename = '/home/hamish/dev/wwftrademapper/trademapper-js/tests/data/Ivory_tiny.csv',

	init = function(fileInput, callback) {
		fileInputElement = fileInput;
		csvFileLoadedCallback = callback;
		fileInputElement.addEventListener('change', loadCSVFile);
	},
	
	loadCSVFile = function() {
		var file = fileInputElement.files[0];

		if (file.type == 'text/comma-separated-values') {
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
		var csvData = d3.csv.parseRows(fileText);
		// make routes from CSV
		// TODO: do different things for different formats
		console.log(csvData.length + " lines in CSV file");
	};

	return {
		init: init
	};
});
