define(
	['QUnit', 'trademapper.route', 'd3'],
	function(q, route, d3) {
		"use strict";
		var run = function() {
			q.module("PointLatLong module", {
				setup: function() {
					// set a default function - required before we can create points
					route.setLatLongToPointFunc(function() { return [3, 4]; });
				}
			});

			q.test('check PointLatLong sets point using latLongToPointFunc', function() {
				var point = new route.PointLatLong(5, 6);
				q.equal(5, point.latlong[0], 'The x of latlong should be 5');
				q.equal(6, point.latlong[1], 'The y of latlong should be 6');
				q.equal(3, point.point[0], 'The x of point should be 3');
				q.equal(4, point.point[1], 'The y of point should be 4');
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
				}
			});

			q.test('check Route toString() contains strings for all points', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);

				var routeString = route1.toString();
				q.ok(routeString.indexOf(point1.toString()) > -1);
				q.ok(routeString.indexOf(point2.toString()) > -1);
				q.ok(routeString.indexOf(point3.toString()) > -1);
			});

			q.test('check Route toString() is same for two routes with same points in same order', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);
				var route2 = new route.Route([point1, point2, point3], 20);

				q.equal(route1.toString(), route2.toString());
			});

			q.test('check Route toString() is different for two routes with same points in different order', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);
				var route2 = new route.Route([point1, point3, point2], 20);

				q.notEqual(route1.toString(), route2.toString());
			});

			q.test('check RouteCollection adds new routes not in it currently', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);
				var route2 = new route.Route([point1, point3, point2], 20);

				var collection = new route.RouteCollection();
				q.equal(0, collection.routeCount());
				collection.addRoute(route1);
				q.equal(1, collection.routeCount());
				collection.addRoute(route2);
				q.equal(2, collection.routeCount());
			});

			q.test('check RouteCollection combines weight of routes with same points in same order', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);
				var route2 = new route.Route([point1, point2, point3], 10);

				var collection = new route.RouteCollection();
				q.equal(0, collection.routeCount());
				collection.addRoute(route1);
				q.equal(1, collection.routeCount());
				q.equal(20, collection.getRoutes()[0].weight);
				collection.addRoute(route2);
				q.equal(1, collection.routeCount());
				q.equal(30, collection.getRoutes()[0].weight);
			});

		};
		return {run: run};
	}
);
