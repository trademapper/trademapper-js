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

			q.test("check verification of UNLOCODE codes", function() {
				q.equal(portlookup.isUnlocode("AEFJR"), true);
				q.equal(portlookup.isUnlocode("XXXXX"), false);
			});

			q.test("check port name lookup", function () {
				// ICAO code
				q.equal(portlookup.getPortName("AYGA"), "Goroka Airport");

				// IATA code
				q.equal(portlookup.getPortName("MAG"), "Madang Airport");

				// UNLOCODE
				q.equal(portlookup.getPortName("AEFJR"), "Fujairah");

				// non-existent code
				q.equal(portlookup.getPortName("YYEYYYEYEYS"), null);
			});

			q.test("check port details lookup by ICAO code", function () {
				// lookup via ICAO code
				var expectedICAO = {
					"countryCode": "BR",
					"lat": -4.871520042,
					"lon": -66.89749908,
					"name": "Carauari Airport",
					"portType": "air"
				}

				q.deepEqual(portlookup.getPortDetails("SWCA"), expectedICAO);

				// non-existent port
				q.equal(portlookup.getPortDetails("XAASAAAA"), null);
			});

			q.test("check port details lookup by UNLOCODE", function () {
				// lookup via UNLOCODE code
				var expectedICAO = {
					"lat": 50.71933,
					"lon": -127.4907,
					"name":"Port Hardy",
					"portType":"sea",
					"countryCode":"CA"
				}

				q.deepEqual(portlookup.getPortDetails("CAPHY"), expectedICAO);
			});
		};

		return {run: run};
	}
);
