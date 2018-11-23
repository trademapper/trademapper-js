define(["map/ports"], function (ports) {

	// lookup port codes from openflights data
	return {

		// returns true if text is a valid ICAO port code
		isICAOCode: function (text) {
			return ports.icao.hasOwnProperty(text);
		},

		// returns true if text is a valid IATA port code
		isIATACode: function (text) {
			return ports.iata.hasOwnProperty(text);
		},

	};

});
