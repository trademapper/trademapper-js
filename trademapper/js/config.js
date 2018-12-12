define(["configextra"], function(configextra) {
	/* Default settings */
	var settings = {
		// global colour settings
		// TODO allow these to be set as rgba values, but parse them into separate
		// hex colour code and opacity values; this is because Inkscape (and
		// possibly other SVG editors) can't cope with rgba colour values
		styles: {
			COUNTRY: "#DFDFDF",
			COUNTRY_TRADING: "#9b9b9b",
			COUNTRY_BORDER: "#FFFFFF",
			OCEAN: "#FFFFFF",
			DISPUTED: "#4a4a4a",
			ARROW_WIDE: "#FFF",
			ARROW_WIDE_OPACITY: "1",
			ARROW_NARROW: "#4a4a4a",
			ARROW_NARROW_OPACITY: "1.0",
			ARROW_NARROW_PLAIN: "#4a4a4a",
			ARROW_NARROW_PLAIN_OPACITY: "1.0",

			// colours for nodes; if these are changed here, the corresponding
			// variables at the top of the trademapper.scss file should also be edited
			TRADE_ORIGIN: "#000000",
			TRADE_EXPORTER: "#45689F",
			TRADE_IMPORTER: "#FF6600",
			TRADE_TRANSIT: "#20AF9F",

			LEGEND_TEXT: "#333333",
			LEGEND_BACKGROUND: "#F8F8F8",
			LEGEND_STROKE_COLOUR: "#999",
			LEGEND_STROKE_WIDTH:"1",


			// these are the default colours used for layers
			DEFAULT_LAYER_COLOURS: [
				"#1f9f2f",
				"#a27d29",
				"#b5132d",
			],

			// the values in here are set by the user when uploading topojson layers
			LAYER_COLOURS: {},

			FONT_FAMILY: "'Helvetica Neue',Helvetica,Arial,sans-serif",
		},

		// properties used by trademapper.js
		ratio: 0.86,
		arrowColours: {
			// opacity for the highlighted path
			opacity: 0.9,
			pathStartColour: "#656465",
			pathStartOpacity: "0.8",
			pathEndColour: "#4a2879",
			pathEndOpacity: "0.8"
		},
		pointTypeSize: {
			origin: 5.5,
			exporter: 4,
			transit: 2.5,
			importer: 2
		},
		minArrowWidth: 1,
		maxArrowWidth: 6,
		arrowType: "plain-arrows",  // could be "plain-arrows" or "flowmap"
		skipCsvAutoDetect: false,
		width: 950,
		height: 500,

		// Analytics (null for no analytics)
		trackingId: null
	};

	/* Apply overrides from deployment specific config file */
	for (var attrname in configextra) {
		settings[attrname] = configextra[attrname];
	}

	return settings;
});
