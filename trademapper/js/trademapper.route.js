
define([], function() {
	"use strict";
	// this is done to avoid circular dependencies
	var countryGetPointFunc, latLongToPointFunc,

	setLatLongToPointFunc = function(func) {
		latLongToPointFunc = func;
	},

	setCountryGetPointFunc = function(func) {
		countryGetPointFunc = func;
	};

	function PointLatLong(latitude, longitude) {
		this.type = "latlong";
		this.latlong = [latitude, longitude];
		this.point = latLongToPointFunc(this.latlong);
	}

	PointLatLong.prototype.toString = function() {
		return this.latlong[0] + '-' + this.latlong[1];
	};

	function PointCountry(countryCode) {
		this.type = "country";
		this.countryCode = countryCode;
		this.point = countryGetPointFunc(countryCode);
	}

	PointCountry.prototype.toString = function() {
		return this.countryCode;
	};

	/*
	 * points is a list of objects of PointXyz
	 * weight is the volume of trade
	 */
	function Route(points, weight) {
		this.points = points;
		this.weight = weight || 1;
	}

	Route.prototype.toString = function() {
		return this.points.map(function(p){return p.toString();}).join();
	};

	function RouteCollection() {
		this.routes = {};
	}

	RouteCollection.prototype.routeCount = function() {
		var routes = Object.keys(this.routes);
		return routes.length;
	};

	// TODO: add filters, eg minimum weight ...
	RouteCollection.prototype.getRoutes = function() {
		var routeList = [], routeKeys = Object.keys(this.routes);
		for (var i = 0; i < routeKeys.length; i++) {
			routeList.push(this.routes[routeKeys[i]]);
		}
		return routeList;
	};

	RouteCollection.prototype.getCenterTerminalList = function() {
		var i, j, route, source, dest, sourceKeys, destKeys, terminalList,
			centerObj, terminalObj, maxSourceQuantity,
			centerTerminalObj = {},
			centerTerminalList = [],
			routeKeys = Object.keys(this.routes);

		// first extract into nested objects and de-duplicate routes
		for (i = 0; i < routeKeys.length; i++) {
			route = this.routes[routeKeys[i]];
			for (j = 0; j < route.points.length - 1; j++) {
				source = route.points[j];
				dest = route.points[j + 1];
				// TODO: record type - source or transit - maybe we get two different sets ...
				// or could be [source2dest, source2transit, transit2dest, transit2transit]
				// to allow for different gradients - but then they will be on top of each other :/
				if (!centerTerminalObj.hasOwnProperty(source.toString())) {
					centerTerminalObj[source.toString()] = {
						point: source.point,
						quantity: route.weight
					};
				} else {
					centerTerminalObj[source.toString()].quantity += route.weight;
				}

				if (!centerTerminalObj[source.toString()].hasOwnProperty(dest.toString())) {
					centerTerminalObj[source.toString()][dest.toString()] = {
						point: dest.point,
						quantity: route.weight
					};
				} else {
					centerTerminalObj[source.toString()][dest.toString()].quantity += route.weight;
				}
			}
		}
		
		// now convert to list of center and terminals
		maxSourceQuantity = 0;
		sourceKeys = Object.keys(centerTerminalObj);
		for (i = 0; i < sourceKeys.length; i++) {
			terminalList = [];
			centerObj = centerTerminalObj[sourceKeys[i]];
			if (centerObj.point === undefined) {
				console.log("missing point for center: " + sourceKeys[i]);
				continue;
			}
			if (centerObj.quantity > maxSourceQuantity) {
				maxSourceQuantity = centerObj.quantity;
			}
			destKeys = Object.keys(centerObj);
			for (j = 0; j < destKeys.length; j++) {
				if (destKeys[j] === "point" || destKeys[j] === "quantity") {
					continue;
				}
				terminalObj = centerObj[destKeys[j]];
				if (terminalObj.point === undefined) {
					console.log("missing point for terminal: " + destKeys[j]);
					continue;
				}
				terminalList.push({
					lat: terminalObj.point[0],
					lng: terminalObj.point[1],
					quantity: terminalObj.quantity
				});
			}
			centerTerminalList.push({
				center: {
					lat: centerObj.point[0],
					lng: centerObj.point[1],
					quantity: centerObj.quantity
				},
				terminals: terminalList
			});
		}
		return {
			centerTerminalList: centerTerminalList,
			maxSourceQuantity: maxSourceQuantity
		};
	};

	RouteCollection.prototype.addRoute = function(route) {
		var routeName = route.toString();
		if (this.routes.hasOwnProperty(routeName)) {
			this.routes[routeName].weight += route.weight;
		}
		else {
			this.routes[routeName] = route;
		}
	};

	RouteCollection.prototype.maxWeight = function() {
		var routeList = this.getRoutes();
		if (routeList.length === 0) {
			return 0;
		} else {
			return Math.max.apply(null, routeList.map(function(aRoute) {
				return aRoute.weight;
			}));
		}
	};

	return {
		setCountryGetPointFunc: setCountryGetPointFunc,
		setLatLongToPointFunc: setLatLongToPointFunc,
		PointLatLong: PointLatLong,
		PointCountry: PointCountry,
		Route: Route,
		RouteCollection: RouteCollection
	};
});

