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

		// returns port name, either by looking it up via ICAO codes or by
		// the mapping from IATA codes to ICAO codes; returns name string,
		// or null if name not found
		getPortName: function (code) {
			if (!code) {
				return null;
			}

			// ICAO codes are 4 characters long, IATA characters are 3
			if (code.length === 4) {
				var port = ports.icao[code];
				if (port) {
					return port.name;
				}
			}	else {
				return this.getPortName(ports.iata[code]);
			}

			return undefined;
		},

	};

});
