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

	// represents a layer and its UI pieces
	var Layer = function (filename, colour) {
		var self = $({});

		// template filled with filename and current colour
		var ctx = {filename: filename, colour: colour};
		var html = util.renderTemplate(layerElementSkeleton, ctx);

		self.elt = $(html);

		// TODO initialise colour picker

		// TODO bind to clicks on the colour picker

		// TODO setColour() method which fires a "colour" event

		return self;
	};

	return {
		// colours assigned to layers by default (in this order);
		// the number of colours in this array also limits the number of layers
		// which can be added (only add layers for which we have colours)
		LAYER_COLOURS: [
			"rgba(255, 0, 0, 0.2)",
			"rgba(0, 255, 0, 0.2)",
			"rgba(0, 0, 255, 0.2)",
		],

		// Layer instances
		layers: [],

		init: function (formElementId) {
			var moduleThis = this;

			this.form = $(formElementId);
			this.form.html(layerFormSkeleton);

			this.layerContainer = this.form.find("[data-role='layers']");

			// for firing events
			this.eventFirer = $({});

			// the "Add layer" button
			this.button = this.form.find(".custom-fileinput");

			// TODO add layer properly using file input's value
			this.button.find("input").on("click", function () {
				moduleThis.addLayer("file " + (moduleThis.layers.length + 1));
			});
		},

		enableButton: function () {
			this.button.removeAttr("disabled");
		},

		disableButton: function () {
			this.button.attr("disabled", "disabled");
		},

		addLayer: function (filename) {
			var layerNumber = this.layers.length + 1;
			var maxLayers = this.LAYER_COLOURS.length;

			if (layerNumber > maxLayers) {
				return;
			}

			// hide the "Add layer" button if we have the maximum number of layers
			if (layerNumber === maxLayers) {
				this.button.fadeOut();
			}

			// make Layer
			var layer = Layer(filename, this.LAYER_COLOURS[layerNumber - 1]);
			this.layers.push(layer);

			// add layer.elt to DOM
			this.layerContainer.append(layer.elt);
		},
	};

});
