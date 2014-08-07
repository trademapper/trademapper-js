define(
	['QUnit', 'trademapper.route', 'd3'],
	function(q, route, d3) {
		"use strict";
		var pointL1, pointL2, pointL3, pointL4, pointC1, pointC2, pointC3, pointC4;

		var run = function() {
			q.module("PointLatLong module", {
				setup: function() {
					// set a default function - required before we can create points
					route.setLatLongToPointFunc(function() { return [3, 4]; });
				}
			});

			q.test('check PointLatLong sets point using latLongToPointFunc', function() {
				route.setLatLongToPointFunc(function() { return [3, 4]; });
				var point = new route.PointLatLong(5, 6);
				q.equal(point.latlong[0], 5, 'The x of latlong should be 5');
				q.equal(point.latlong[1], 6, 'The y of latlong should be 6');
				q.equal(point.point[0], 3, 'The x of point should be 3');
				q.equal(point.point[1], 4, 'The y of point should be 4');
			});

			q.test('check PointLatLong toString() includes lat and long', function() {
				var point = new route.PointLatLong(5.34, 6.12);
				var pointString = point.toString();
				q.ok(pointString.indexOf("5.34") > -1);
				q.ok(pointString.indexOf("6.12") > -1);
			});

			q.test('check PointLatLong toString() is same for two points with same lat/long', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointLatLong(5.34, 6.12);
				q.equal(point1.toString(), point2.toString());
			});

			q.module("PointCountry module", {
				setup: function() {
					// set a default function - required before we can create points
					route.setCountryGetPointFunc(function() { return [8, 9]; });
				}
			});

			q.test('check PointCountry sets point using countryGetPointFunc', function() {
				var point = new route.PointCountry("GB");
				q.equal("GB", point.countryCode, 'The countryCode should be "GB"');
				q.equal(8, point.point[0], 'The x of point should be 8');
				q.equal(9, point.point[1], 'The y of point should be 9');
			});

			q.test('check PointCountry toString() includes country code', function() {
				var point = new route.PointCountry("KE");
				var pointString = point.toString();
				q.ok(pointString.indexOf("KE") > -1);
			});

			q.test('check PointCountry toString() is same for two points with same country code', function() {
				var point1 = new route.PointCountry("ZA");
				var point2 = new route.PointCountry("ZA");
				q.equal(point1.toString(), point2.toString());
			});

			q.module("BothPoint module", {
				setup: function() {
					// set a default function - required before we can create points
					route.setLatLongToPointFunc(function() { return [3, 4]; });
					route.setCountryGetPointFunc(function() { return [8, 9]; });
					pointL1 = new route.PointLatLong(5.34, 6.12);
					pointL2 = new route.PointLatLong(5.34, 6.12);
					pointC1 = new route.PointCountry("ZA");
					pointC2 = new route.PointCountry("GB");
				}
			});

			q.test('check Route toString() contains strings for all points', function() {
				var route1 = new route.Route([pointL1, pointC1, pointC2], 20);

				var routeString = route1.toString();
				q.ok(routeString.indexOf(pointL1.toString()) > -1);
				q.ok(routeString.indexOf(pointC1.toString()) > -1);
				q.ok(routeString.indexOf(pointC2.toString()) > -1);
			});

			q.test('check Route toString() is same for two routes with same points in same order', function() {
				var route1 = new route.Route([pointL1, pointC1, pointC2], 20);
				var route2 = new route.Route([pointL1, pointC1, pointC2], 20);

				q.equal(route1.toString(), route2.toString());
			});

			q.test('check Route toString() is different for two routes with same points in different order', function() {
				var route1 = new route.Route([pointL1, pointC1, pointC2], 20);
				var route2 = new route.Route([pointL1, pointC2, pointC1], 20);

				q.notEqual(route1.toString(), route2.toString());
			});

			q.test('check RouteCollection adds new routes not in it currently', function() {
				var route1 = new route.Route([pointL1, pointC1, pointC2], 20);
				var route2 = new route.Route([pointL1, pointC2, pointC1], 20);

				var collection = new route.RouteCollection();
				q.equal(0, collection.routeCount());
				collection.addRoute(route1);
				q.equal(1, collection.routeCount());
				collection.addRoute(route2);
				q.equal(2, collection.routeCount());
			});

			q.test('check RouteCollection combines quantity of routes with same points in same order', function() {
				var route1 = new route.Route([pointL1, pointC1, pointC2], 20);
				var route2 = new route.Route([pointL1, pointC1, pointC2], 10);

				var collection = new route.RouteCollection();
				q.equal(0, collection.routeCount());
				collection.addRoute(route1);
				q.equal(1, collection.routeCount());
				q.equal(20, collection.getRoutes()[0].quantity);
				collection.addRoute(route2);
				q.equal(1, collection.routeCount());
				q.equal(30, collection.getRoutes()[0].quantity);
			});

			q.test('check RouteCollection maxQuantity returns 0 when it has no routes', function() {
				var collection = new route.RouteCollection();
				q.equal(collection.maxQuantity(), 0);
			});

			q.test('check RouteCollection maxQuantity returns 0 when it has one route', function() {
				var collection = new route.RouteCollection(),
					route1 = new route.Route([pointC1, pointC2], 20);
				collection.addRoute(route1);
				q.equal(collection.maxQuantity(), 20);
			});

			q.test('check RouteCollection maxQuantity returns max when it has multiple routes', function() {
				var collection = new route.RouteCollection(),
					route1 = new route.Route([pointL1, pointC1], 10),
					route2 = new route.Route([pointC1, pointC2], 30),
					route3 = new route.Route([pointL1, pointC2], 20);
				collection.addRoute(route1);
				collection.addRoute(route2);
				collection.addRoute(route3);
				q.equal(collection.maxQuantity(), 30);
			});

			q.module("LatLongIdentity module", {
				setup: function() {
					// set a default function - required before we can create points
					route.setLatLongToPointFunc(function(latlong) { return [latlong[0], latlong[1]]; });
					pointL1 = new route.PointLatLong(2.34, 3.45);
					pointL2 = new route.PointLatLong(4.56, 5.67);
					pointL3 = new route.PointLatLong(6.78, 7.89);
					pointL4 = new route.PointLatLong(8.90, 9.01);
				}
			});

			q.test('check RouteCollection getCenterTerminalList does one two-stop route correctly', function() {
				var ctAndMax,
					collection = new route.RouteCollection(),
					route1 = new route.Route([pointL1, pointL2], 10);
				collection.addRoute(route1);
				ctAndMax = collection.getCenterTerminalList();
				q.equal(ctAndMax.maxSourceQuantity, 10);
				q.deepEqual(ctAndMax.centerTerminalList,
					[
						{
							center: {
								lat: 2.34,
								lng: 3.45,
								quantity: 10,
								point: pointL1
							},
							terminals: [
								{
									lat: 4.56,
									lng: 5.67,
									quantity: 10
								}
							]
						}
					]);
			});

			q.test('check RouteCollection getCenterTerminalList does one three-stop route correctly', function() {
				var ctAndMax,
					collection = new route.RouteCollection(),
					route1 = new route.Route([pointL1, pointL2, pointL3], 10);
				collection.addRoute(route1);
				ctAndMax = collection.getCenterTerminalList();
				q.equal(ctAndMax.maxSourceQuantity, 10);
				q.deepEqual(ctAndMax.centerTerminalList,
					[
						{
							center: {
								lat: 2.34,
								lng: 3.45,
								quantity: 10,
								point: pointL1
							},
							terminals: [
								{
									lat: 4.56,
									lng: 5.67,
									quantity: 10
								}
							]
						},
						{
							center: {
								lat: 4.56,
								lng: 5.67,
								quantity: 10,
								point: pointL2
							},
							terminals: [
								{
									lat: 6.78,
									lng: 7.89,
									quantity: 10
								}
							]
						}
					]);
			});

			q.test('check RouteCollection getCenterTerminalList does two two-stop route correctly (same start)', function() {
				// Note the center quantity should be the sum of the others
				var ctAndMax,
					collection = new route.RouteCollection(),
					route1 = new route.Route([pointL1, pointL2], 10),
					route2 = new route.Route([pointL1, pointL3], 20);
				collection.addRoute(route1);
				collection.addRoute(route2);
				ctAndMax = collection.getCenterTerminalList();
				q.equal(ctAndMax.maxSourceQuantity, 30);
				q.deepEqual(ctAndMax.centerTerminalList,
					[
						{
							center: {
								lat: 2.34,
								lng: 3.45,
								quantity: 30,
								point: pointL1
							},
							terminals: [
								{
									lat: 4.56,
									lng: 5.67,
									quantity: 10
								},
								{
									lat: 6.78,
									lng: 7.89,
									quantity: 20
								}
							]
						}
					]);
			});

			q.test('check RouteCollection getCenterTerminalList does overlapping two-stop and three-stop route correctly', function() {
				// Note the center quantity should be the sum of the others
				var ctAndMax,
					collection = new route.RouteCollection(),
					route1 = new route.Route([pointL1, pointL2, pointL3], 10),
					route2 = new route.Route([pointL2, pointL4], 20);
				collection.addRoute(route1);
				collection.addRoute(route2);
				ctAndMax = collection.getCenterTerminalList();
				q.equal(ctAndMax.maxSourceQuantity, 30);
				q.deepEqual(ctAndMax.centerTerminalList,
					[
						{
							center: {
								lat: 2.34,
								lng: 3.45,
								quantity: 10,
								point: pointL1
							},
							terminals: [
								{
									lat: 4.56,
									lng: 5.67,
									quantity: 10
								}
							]
						},
						{
							center: {
								lat: 4.56,
								lng: 5.67,
								quantity: 30,
								point: pointL2
							},
							terminals: [
								{
									lat: 6.78,
									lng: 7.89,
									quantity: 10
								},
								{
									lat: 8.90,
									lng: 9.01,
									quantity: 20
								}
							]
						}
					]);
			});

			q.module("Country Points module", {
				setup: function() {
					// set a default function - required before we can create points
					route.setCountryGetPointFunc(function() { return [8, 9]; });
					pointC1 = new route.PointCountry("ZA");
					pointC2 = new route.PointCountry("GB");
					pointC3 = new route.PointCountry("ZW");
					pointC4 = new route.PointCountry("AR");
				}
			});

			q.test('check getPointRoles sets source and dest for one two-stop route', function() {
				var pointRoles,
					collection = new route.RouteCollection(),
					route1 = new route.Route([pointC1, pointC2], 10);
				collection.addRoute(route1);
				pointRoles = collection.getPointRoles();
				q.deepEqual(pointRoles, {
					"ZA": {
						point: pointC1,
						source: true,
						transit: false,
						dest: false
					},
					"GB": {
						point: pointC2,
						source: false,
						transit: false,
						dest: true
					}
				});
			});

			q.test('check getPointRoles sets source, transit and dest for one three-stop route', function() {
				var pointRoles,
					collection = new route.RouteCollection(),
					route1 = new route.Route([pointC1, pointC2, pointC3], 10);
				collection.addRoute(route1);
				pointRoles = collection.getPointRoles();
				q.deepEqual(pointRoles, {
					"ZA": {
						point: pointC1,
						source: true,
						transit: false,
						dest: false
					},
					"GB": {
						point: pointC2,
						source: false,
						transit: true,
						dest: false
					},
					"ZW": {
						point: pointC3,
						source: false,
						transit: false,
						dest: true
					}
				});
			});

			q.test('check getPointRoles sets source, transit and dest for overlapping two-stop and three-stop route', function() {
				var pointRoles,
					collection = new route.RouteCollection(),
					route1 = new route.Route([pointC1, pointC2, pointC3], 10),
					route2 = new route.Route([pointC2, pointC4], 20);
				collection.addRoute(route1);
				collection.addRoute(route2);
				pointRoles = collection.getPointRoles();
				q.deepEqual(pointRoles, {
					"ZA": {
						point: pointC1,
						source: true,
						transit: false,
						dest: false
					},
					"GB": {
						point: pointC2,
						source: true,
						transit: true,
						dest: false
					},
					"ZW": {
						point: pointC3,
						source: false,
						transit: false,
						dest: true
					},
					"AR": {
						point: pointC4,
						source: false,
						transit: false,
						dest: true
					}
				});
			});

		};
		return {run: run};
	}
);
