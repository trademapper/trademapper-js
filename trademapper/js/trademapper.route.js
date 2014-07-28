
define([], function() {
	// this is done to avoid circular dependencies
	var countryGetPointFunc, latLongToPointFunc,

	setCountryGetPointFunc = function(func) {
		countryGetPointFunc = func;
	};

	setLatLongToPointFunc = function(func) {
		latLongToPointFunc = func;
	};

	function PointLatLong(latitude, longitude) {
		this.type = "latlong";
		this.latlong = [latitude, longitude];
		this.point = latLongToPointFunc(this.latlong);
	}

	function PointCountry(countryCode, getLatLongCallback) {
		this.type = "country";
		this.countryCode = countryCode;
		this.point = countryGetPointFunc(this.countryCode);
	}

	function Route(points, weight) {
		this.points = points;
		this.weight = weight || 1;
	}

	return {
		setCountryGetPointFunc: setCountryGetPointFunc,
		setLatLongToPointFunc: setLatLongToPointFunc,
		PointLatLong: PointLatLong,
		PointCountry: PointCountry,
		Route: Route
	};
});

