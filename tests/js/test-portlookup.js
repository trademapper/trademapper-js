define(
	['QUnit', 'trademapper.portlookup'],
	function(q, portlookup) {
		"use strict";

		var run = function() {
			q.module("Portlookup");

			q.test("check verification of IATA codes", function() {
				q.equal(portlookup.isIATACode("RPM"), true);
				q.equal(portlookup.isIATACode("XXX"), false);
			});

			q.test("check verification of ICAO codes", function() {
				q.equal(portlookup.isICAOCode("YFBS"), true);
				q.equal(portlookup.isICAOCode("XXXX"), false);
			});

			q.test("check port name lookup", function () {
				// ICAO code
				q.equal(portlookup.getPortName("AYGA"), "Goroka Airport");

				// IATA code
				q.equal(portlookup.getPortName("MAG"), "Madang Airport");

				// non-existent code
				q.equal(portlookup.getPortName("YYEYYYEYEYS"), null);
			});
		};

		return {run: run};
	}
);
