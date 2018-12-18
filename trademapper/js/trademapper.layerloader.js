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
	"vendor/doT",
	"config",
	"text!../fragments/layerelementskeleton.html",
	"text!../fragments/layerformskeleton.html",
], function ($, doT, config, layerElementSkeleton, layerFormSkeleton) {

	// represents a layer and its related DOM elements;
	// filesize is in bytes
	var Layer = function (id, filename, filesize, colour, data) {
		// template filled with filename and current colour
		var ctx = {filename: filename, colour: colour};
		var elt = doT.template(layerElementSkeleton)(ctx);

		return {
			id: id,
			filename: filename,
			filesize: filesize,
			colour: colour,
			data: data,
			elt: elt,
		};
	};

	// events:
	// "start" -> starting to load layer JSON
  // "layer" -> payload is the Layer object which was created
	// "error" -> payload is the error message
	// "end" -> done loading layer JSON
	return {
		// colours assigned to layers by default (in this order);
		// the number of colours in this array also limits the number of layers
		// which can be added (we only add layers for which we have colours)
		LAYER_COLOURS: config.styles.DEFAULT_LAYER_COLOURS,

		// Layer instances
		layers: [],

		isLoading: false,

		init: function (formElementId) {
			var moduleThis = this;

			this.form = $(formElementId);
			this.form.html(layerFormSkeleton);

			this.layerContainer = this.form.find("[data-role='layers']");
			this.errorsPanel = this.form.find(".layer-load-errors")

			// for firing events
			this.eventFirer = $({});

			// the "Add layer" button
			this.buttonContainer = this.form.find(".group-custom-fileinput");
			this.button = this.buttonContainer.find(".custom-fileinput");

			// add layer using file input's value
			this.button.find("input").on("change", function (event) {
				if (event.target.files.length < 1) {
					moduleThis.showError("Please specify valid file to load");
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
					try {
						var data = JSON.parse(reader.result);

						// resolve to parsed JSON
						resolve(data);
					} catch (e) {
						reject("Unable to load JSON from file " + file.name);
					}
				};
			});

			reader.readAsText(file);

			return promise;
		},

		showError: function (message) {
			this.errorsPanel.append("<p>" + message + "</p>");
		},

		clearErrors: function () {
			this.errorsPanel.html("");
		},

		// add the layer to the panel; this is done separately so that the
		// layer is only shown if its SVG is successfully loaded into the DOM
		layerReady: function (layer) {
			this.layerContainer.append(layer.elt);

			this.layers.push(layer);

			// hide the "Add layer" button if we have the maximum number of layers
			if (this.layers.length === this.LAYER_COLOURS.length) {
				this.buttonContainer.fadeOut();
			}

			this.setIsLoading(false);
			this.eventFirer.trigger("end");
		},

		// file: File object
		addLayer: function (file) {
			this.eventFirer.trigger("start", file.size);

			this.clearErrors();

			var layerNumber = this.layers.length + 1;
			if (layerNumber > this.LAYER_COLOURS.length) {
				return;
			}

			// we can load the layer
			this.setIsLoading(true);

			// load layer JSON
			this.loadTopoJSONFile(file).then(
				function (data) {
					// make Layer
					var layer = Layer("layer" + layerNumber, file.name,
						file.size, this.LAYER_COLOURS[layerNumber - 1], data);

					// notify listeners that layer is ready
					this.eventFirer.trigger("layer", layer);
				}.bind(this),

				function (error) {
					this.showError(error);
					this.eventFirer.trigger("error", error);
					this.setIsLoading(false);
				}.bind(this)
			);
		},
	};

});
