define(["configextra"], function(configextra) {
	/* Default settings */
	var settings = {
		// global colour settings
		colours: {
			COUNTRY: "#DFDFDF",
			COUNTRY_TRADING: "#B1C73E",
			COUNTRY_BORDER: "#FFFFFF",
			OCEAN: "#FFFFFF",
			DISPUTED: "#AAAAAA",
			ARROW_WIDE: "rgba(102, 102, 102, 0.4)",
			ARROW_NARROW: "#000000",
			ARROW_NARROW_PLAIN: "rgba(102, 102, 102, 1.0)",

			// colours for nodes; if these are changed here, the corresponding
			// variables at the top of the trademapper.scss file should also be edited
			TRADE_ORIGIN: "#000000",
			TRADE_EXPORTER: "#45689F",
			TRADE_IMPORTER: "#FF6600",
			TRADE_TRANSIT: "#20AF9F",

			LEGEND_TEXT: "#333333",
			LEGEND_BACKGROUND: "#F8F8F8",

			// this may eventually be customisable by the user and/or set per overlay
			OVERLAY_POLYGON: "rgba(168, 0, 0, 0.4)",
			OVERLAY_POLYGON_BOUNDARY: "rgba(0, 0, 0, 0.4)",
			OVERLAY_LINE: "rgba(0, 0, 255, 0.8)",
			OVERLAY_POINT: "rgba(0, 255, 0, 0.6)",
		},

		FONT_FAMILY: "'Helvetica Neue',Helvetica,Arial,sans-serif",

		// properties used by trademapper.js
		ratio: 0.86,
		arrowColours: {
			opacity: 0.6,
			pathStart: "rgba(0,0,0,1)",
			pathEnd: "rgba(0,0,0,0.4)"
		},
		pointTypeSize: {
			origin: 5.5,
			exporter: 4,
			transit: 2.5,
			importer: 2
		},
		minArrowWidth: 0.75,
		maxArrowWidth: 20,
		arrowType: "flowmap",  // could be "plain-arrows" or "flowmap"
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
