
define([], function() {
	// this is done to avoid circular dependencies
	var countryGetPointFunc, latLongToPointFunc,

	setLatLongToPointFunc = function(func) {
		latLongToPointFunc = func;
	};

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

	RouteCollection.prototype.addRoute = function(route) {
		var routeName = route.toString();
		if (this.routes.hasOwnProperty(routeName)) {
			this.routes[routeName].weight += route.weight;
		}
		else {
			this.routes[routeName] = route;
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

