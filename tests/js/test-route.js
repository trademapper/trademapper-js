define(
	['trademapper.route', 'd3'],
	function(route, d3) {
		"use strict";
		var run = function() {
			QUnit.module("PointLatLong module", {
				setup: function() {
					// set a default function - required before we can create points
					route.setLatLongToPointFunc(function() { return [3, 4]; });
				}
			});

			test('check PointLatLong sets point using latLongToPointFunc', function() {
				var point = new route.PointLatLong(5, 6);
				equal(5, point.latlong[0], 'The x of latlong should be 5');
				equal(6, point.latlong[1], 'The y of latlong should be 6');
				equal(3, point.point[0], 'The x of point should be 3');
				equal(4, point.point[1], 'The y of point should be 4');
			});

			test('check PointLatLong toString() includes lat and long', function() {
				var point = new route.PointLatLong(5.34, 6.12);
				var pointString = point.toString();
				ok(pointString.indexOf("5.34") > -1);
				ok(pointString.indexOf("6.12") > -1);
			});

			test('check PointLatLong toString() is same for two points with same lat/long', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointLatLong(5.34, 6.12);
				equal(point1.toString(), point2.toString());
			});

			QUnit.module("PointCountry module", {
				setup: function() {
					// set a default function - required before we can create points
					route.setCountryGetPointFunc(function() { return [8, 9]; });
				}
			});

			test('check PointCountry sets point using countryGetPointFunc', function() {
				var point = new route.PointCountry("GB");
				equal("GB", point.countryCode, 'The countryCode should be "GB"');
				equal(8, point.point[0], 'The x of point should be 8');
				equal(9, point.point[1], 'The y of point should be 9');
			});

			test('check PointCountry toString() includes country code', function() {
				var point = new route.PointCountry("KE");
				var pointString = point.toString();
				ok(pointString.indexOf("KE") > -1);
			});

			test('check PointCountry toString() is same for two points with same country code', function() {
				var point1 = new route.PointCountry("ZA");
				var point2 = new route.PointCountry("ZA");
				equal(point1.toString(), point2.toString());
			});

			QUnit.module("BothPoint module", {
				setup: function() {
					// set a default function - required before we can create points
					route.setLatLongToPointFunc(function() { return [3, 4]; });
					route.setCountryGetPointFunc(function() { return [8, 9]; });
				}
			});

			test('check Route toString() contains strings for all points', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);

				var routeString = route1.toString();
				ok(routeString.indexOf(point1.toString()) > -1);
				ok(routeString.indexOf(point2.toString()) > -1);
				ok(routeString.indexOf(point3.toString()) > -1);
			});

			test('check Route toString() is same for two routes with same points in same order', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);
				var route2 = new route.Route([point1, point2, point3], 20);

				equal(route1.toString(), route2.toString());
			});

			test('check Route toString() is different for two routes with same points in different order', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);
				var route2 = new route.Route([point1, point3, point2], 20);

				notEqual(route1.toString(), route2.toString());
			});

			test('check RouteCollection adds new routes not in it currently', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);
				var route2 = new route.Route([point1, point3, point2], 20);

				var collection = new route.RouteCollection();
				equal(0, collection.routeCount());
				collection.addRoute(route1);
				equal(1, collection.routeCount());
				collection.addRoute(route2);
				equal(2, collection.routeCount());
			});

			test('check RouteCollection combines weight of routes with same points in same order', function() {
				var point1 = new route.PointLatLong(5.34, 6.12);
				var point2 = new route.PointCountry("ZA");
				var point3 = new route.PointCountry("GB");
				var route1 = new route.Route([point1, point2, point3], 20);
				var route2 = new route.Route([point1, point2, point3], 10);

				var collection = new route.RouteCollection();
				equal(0, collection.routeCount());
				collection.addRoute(route1);
				equal(1, collection.routeCount());
				equal(20, collection.getRoutes()[0].weight);
				collection.addRoute(route2);
				equal(1, collection.routeCount());
				equal(30, collection.getRoutes()[0].weight);
			});

		};
		return {run: run};
	}
);
