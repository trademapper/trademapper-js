define(["map/ports"], function (ports) {

	// lookup port codes
	return {

		// returns true if text is a valid ICAO airport code
		isICAOCode: function (text) {
			return ports.icao.hasOwnProperty(text);
		},

		// returns true if text is a valid IATA airport code
		isIATACode: function (text) {
			return ports.iata.hasOwnProperty(text);
		},

		// returns true if text is a valid UNLOCODE seaport code
		isUnlocode: function (text) {
			return ports.unlocode.hasOwnProperty(text);
		},

		getPortDetails: function (code) {
			if (!code) {
				return null;
			}

			var port = null;

			// ICAO codes are 4 characters long, IATA characters are 3,
			// UNLOCODEs are 5
			if (code.length === 5) {
				port = ports.unlocode[code];
			} else if (code.length === 4) {
				port = ports.icao[code];
			}	else if (code.length === 3) {
				// IATA codes just map to ICAO codes, so do the lookup again
				port = this.getPortDetails(ports.iata[code]);
			}

			return port || null;
		},

		// returns port name, either by looking it up via ICAO code or UNLOCODE or by
		// mapping from IATA codes to ICAO codes; returns name string,
		// or null if name not found
		getPortName: function (code) {
			var port = this.getPortDetails(code);
			if (port) {
				return port.name;
			}
			return null;
		},

	};

});
