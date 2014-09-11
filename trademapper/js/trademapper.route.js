
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

	function PointLatLong(role, latitude, longitude) {
		this.type = "latlong";
		this.role = role;
		this.latlong = [longitude, latitude];
		this.point = latLongToPointFunc(this.latlong);
	}

	PointLatLong.prototype.toString = function() {
		return this.latlong[0] + '-' + this.latlong[1];
	};

	function PointNameLatLong(name, role, latitude, longitude) {
		this.type = "namelatlong";
		this.name = name;
		this.role = role;
		this.latlong = [longitude, latitude];
		this.point = latLongToPointFunc(this.latlong);
	}

	PointNameLatLong.prototype.toString = function() {
		return this.name;
	};

	function PointCountry(countryCode, role) {
		this.type = "country";
		this.role = role;
		this.countryCode = countryCode;
		this.point = countryGetPointFunc(countryCode);
	}

	PointCountry.prototype.toString = function() {
		return this.countryCode;
	};

	/*
	 * points is a list of objects of PointXyz
	 * quantity is the volume of trade
	 */
	function Route(points, quantity) {
		this.points = points;
		this.quantity = quantity || 1;
	}

	Route.prototype.toString = function(joinStr) {
		return this.points.map(function(p){return p.toString();}).join(joinStr);
	};

	Route.prototype.toHtmlId = function() {
		return this.toString('').toLowerCase().replace(/[^\w]/g, '');
	};

	function RouteCollection() {
		this.routes = {};
	}

	RouteCollection.prototype.routeCount = function() {
		var routes = Object.keys(this.routes);
		return routes.length;
	};

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
						source: source,
						point: source.point,
						quantity: route.quantity
					};
				} else {
					centerTerminalObj[source.toString()].quantity += route.quantity;
				}

				if (!centerTerminalObj[source.toString()].hasOwnProperty(dest.toString())) {
					centerTerminalObj[source.toString()][dest.toString()] = {
						dest: dest,
						point: dest.point,
						quantity: route.quantity
					};
				} else {
					centerTerminalObj[source.toString()][dest.toString()].quantity += route.quantity;
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
				if (destKeys[j] === "point" ||
						destKeys[j] === "quantity" ||
						destKeys[j] === "source") {
					continue;
				}
				terminalObj = centerObj[destKeys[j]];
				if (terminalObj.point === undefined) {
					console.log("missing point for terminal: " + destKeys[j]);
					continue;
				}
				terminalList.push({
					point: terminalObj.dest,
					lat: terminalObj.point[0],
					lng: terminalObj.point[1],
					quantity: terminalObj.quantity
				});
			}
			centerTerminalList.push({
				center: {
					lat: centerObj.point[0],
					lng: centerObj.point[1],
					quantity: centerObj.quantity,
					point: centerObj.source
				},
				terminals: terminalList
			});
		}
		return {
			centerTerminalList: centerTerminalList,
			maxSourceQuantity: maxSourceQuantity
		};
	};

	/*
	 * Create an object with a key for each point, and for each point
	 * record whether it is a source, transit and/or destination node.
	 */
	RouteCollection.prototype.getPointRoles = function() {
		var i, j, route, pointName,
			pointRoles = {},
			routeKeys = Object.keys(this.routes);

		for (i = 0; i < routeKeys.length; i++) {
			route = this.routes[routeKeys[i]];
			for (j = 0; j < route.points.length; j++) {
				pointName = route.points[j].toString();
				if (!pointRoles.hasOwnProperty(pointName)) {
					pointRoles[pointName] = {
						point: route.points[j],
						source: false,
						transit: false,
						dest: false
					};
				}
				if (j === 0) {
					pointRoles[pointName].source = true;
				} else if (j === route.points.length - 1) {
					pointRoles[pointName].dest = true;
				} else {
					pointRoles[pointName].transit = true;
				}
			}
		}
		return pointRoles;
	};

	RouteCollection.prototype.addRoute = function(route) {
		var routeName = route.toString();
		if (this.routes.hasOwnProperty(routeName)) {
			this.routes[routeName].quantity += route.quantity;
		}
		else {
			this.routes[routeName] = route;
		}
	};

	RouteCollection.prototype.maxQuantity = function(minRouteLength) {
		minRouteLength = minRouteLength !== undefined ? minRouteLength : 2;
		var routeList = this.getRoutes();
		if (routeList.length === 0) {
			return 0;
		} else {
			return Math.max.apply(null, routeList.map(function(aRoute) {
				if (aRoute.points.length >= minRouteLength) {
					return aRoute.quantity;
				} else {
					return 0;
				}
			}));
		}
	};

	return {
		setCountryGetPointFunc: setCountryGetPointFunc,
		setLatLongToPointFunc: setLatLongToPointFunc,
		PointLatLong: PointLatLong,
		PointNameLatLong: PointNameLatLong,
		PointCountry: PointCountry,
		Route: Route,
		RouteCollection: RouteCollection
	};
});

