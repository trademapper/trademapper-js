define(["configextra"], function(configextra) {
	/* Default settings */
	var settings = {
		// global colour settings
		// TODO allow these to be set as rgba values, but parse them into separate
		// hex colour code and opacity values; this is because Inkscape (and
		// possibly other SVG editors) can't cope with rgba colour values
		styles: {
			COUNTRY: "#DFDFDF",
			COUNTRY_TRADING: "#B1C73E",
			COUNTRY_BORDER: "#FFFFFF",
			OCEAN: "#FFFFFF",
			DISPUTED: "#AAAAAA",
			ARROW_WIDE: "#FFF",
			ARROW_WIDE_OPACITY: "1",
			ARROW_NARROW: "#666",
			ARROW_NARROW_OPACITY: "1.0",
			ARROW_NARROW_PLAIN: "#666",
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
			

			// the values in here are set by the user when uploading topojson layers
			LAYER_COLOURS: {},

			FONT_FAMILY: "'Helvetica Neue',Helvetica,Arial,sans-serif",
		},

		// properties used by trademapper.js
		ratio: 0.86,
		arrowColours: {
			// opacity for the highlighted path
			opacity: 0.9,
			pathStartColour: "#6719d1",
			pathStartOpacity: "0.8",
			pathEndColour: "#e488f4",
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
