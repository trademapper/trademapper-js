/**
 * Load topojson from files and associate the data with a layer colour.
 *
 * Duties:
 * - show the "Add layer" button (a file input)
 * - get user-requested topojson file from the file input
 * - load topojson file and tell others it's starting to load; disable the
 *   button
 * - once loaded, convert topojson to a JS object, assign a predetermined
 *   colour for that layer, and tell others it's ready and what colour it
 *   should be; show it in a tentative "getting ready to display" row, with the
 *   name of the file and a colour picker next to it; move the "Add layer"
 *   button underneath the rows and enable it
 * - if the layer won't load (not parseable as JSON), let other components know
 *   and show the errors; don't show a row for it; enable the button
 * - when notified that a layer is displayed on the map, make its row
 *   permanent ("displayed" rather than "getting ready to display") and enable
 *   the button
 * - when notified that a layer can't be displayed on the map, remove its row
 *   and show an error; enable the button
 * - if a user selects a new colour for a layer, tell others that the layer
 *   colour should change
 * - count the layers displayed and don't let more than 3 be loaded at once (hide
 *   the "Add layer" button when there are 3)
 */
define([
	"jquery",
	"util",
	"text!../fragments/layerelementskeleton.html",
	"text!../fragments/layerformskeleton.html",
], function ($, util, layerElementSkeleton, layerFormSkeleton) {

	// represents a layer and its related DOM elements
	var Layer = function (id, filename, colour, data) {
		// template filled with filename and current colour
		var ctx = {filename: filename, colour: colour};
		var html = util.renderTemplate(layerElementSkeleton, ctx);

		return {
			id: id,
			filename: filename,
			colour: colour,
			data: data,
			elt: html,
		};
	};

	// events:
  // "layer" -> payload is the Layer object which was created
	// "error" -> payload is the error message
	return {
		// colours assigned to layers by default (in this order);
		// the number of colours in this array also limits the number of layers
		// which can be added (we only add layers for which we have colours)
		LAYER_COLOURS: [
			"rgba(168, 0, 0, 0.4)",
			"rgba(0, 168, 0, 0.4)",
			"rgba(0, 0, 168, 0.4)",
		],

		// Layer instances
		layers: [],

		isLoading: false,

		init: function (formElementId) {
			var moduleThis = this;

			this.form = $(formElementId);
			this.form.html(layerFormSkeleton);

			this.layerContainer = this.form.find("[data-role='layers']");

			// for firing events
			this.eventFirer = $({});

			// the "Add layer" button
			this.button = this.form.find(".custom-fileinput");

			// add layer using file input's value
			this.button.find("input").on("change", function (event) {
				if (event.target.files.length < 1) {
					// TODO error - no file to load
					return;
				}

				moduleThis.addLayer(event.target.files[0]);
			});
		},

		// proxy listener binding calls to the event firer
		on: function () {
			if (this.eventFirer) {
				this.eventFirer.on.apply(this.eventFirer, arguments);
			}
		},

		// bool: true if loading a topojson file, false otherwise
		// this also disables the button while a file is loading
		setIsLoading: function (bool) {
			this.isLoading = bool;

			if (bool) {
				this.disableButton();
				return;
			}

			this.enableButton();
		},

		enableButton: function () {
			this.button.removeAttr("disabled");
		},

		disableButton: function () {
			this.button.attr("disabled", "disabled");
		},

		// file: File object
		loadTopoJSONFile: function (file) {
			var reader = new FileReader();

			var promise = new Promise(function (resolve, reject) {
				reader.onload = function () {
					var data = JSON.parse(reader.result);

					// TODO parse error - bad JSON - reject()

					// return parsed JSON
					resolve(data);
				};
			});

			reader.readAsText(file);

			return promise;
		},

		// file: File object
		addLayer: function (file) {
			var layerNumber = this.layers.length + 1;
			var maxLayers = this.LAYER_COLOURS.length;
			if (layerNumber > maxLayers) {
				return;
			}

			// we can load the layer
			this.setIsLoading(true);

			// hide the "Add layer" button if we have the maximum number of layers
			if (layerNumber === maxLayers) {
				this.button.fadeOut();
			}

			// load layer JSON
			this.loadTopoJSONFile(file).then(
				function (data) {
					// make Layer
					var layer = Layer("layer-" + layerNumber, file.name,
						this.LAYER_COLOURS[layerNumber - 1], data);

					this.layers.push(layer);

					// add layer element to DOM
					this.layerContainer.append(layer.elt);

					this.setIsLoading(false);

					// notify listeners that layer is ready
					this.eventFirer.trigger("layer", layer);
				}.bind(this),

				function (error) {
					// TODO show errors
				}.bind(this)
			);
		},
	};

});
