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
	var Layer = function (filename, colour, data) {
		var self = $({});

		self.filename = filename;
		self.colour = colour;
		self.data = data;

		// template filled with filename and current colour
		var ctx = {filename: filename, colour: colour};
		var html = util.renderTemplate(layerElementSkeleton, ctx);

		self.elt = $(html);

		return self;
	};

	// events:
  // "layer" -> payload is the Layer object which was created
	return {
		// colours assigned to layers by default (in this order);
		// the number of colours in this array also limits the number of layers
		// which can be added (we only add layers for which we have colours)
		LAYER_COLOURS: [
			"rgba(255, 0, 0, 0.6)",
			"rgba(0, 255, 0, 0.6)",
			"rgba(0, 0, 255, 0.6)",
		],

		// Layer instances
		layers: [],

		reader: new FileReader(),

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
			this.button.find("input").on("change", function () {
				if (this.files.length < 1) {
					// TODO error - no file to load
					return;
				}

				moduleThis.addLayer(this.files[0].name);
			});
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

		loadTopoJSON: function (filename) {
			this.reader.onload = function (e) {
				var data = reader.result;

				// TODO error - bad JSON

				// TODO return parsed JSON
			};

			this.reader.readAsText(filename);
		},

		addLayer: function (filename) {
			this.setIsLoading(true);

			var layerNumber = this.layers.length + 1;
			var maxLayers = this.LAYER_COLOURS.length;

			if (layerNumber > maxLayers) {
				return;
			}

			// hide the "Add layer" button if we have the maximum number of layers
			if (layerNumber === maxLayers) {
				this.button.fadeOut();
			}

			// TODO load layer JSON
			var data = null;

			// make Layer
			var layer = Layer(filename, this.LAYER_COLOURS[layerNumber - 1], data);
			this.layers.push(layer);

			// add layer.elt to DOM
			this.layerContainer.append(layer.elt);

			// TODO notify listeners that layer is ready

			// TODO wait until loaded before calling this
			this.setIsLoading(false);
		},
	};

});
