
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

	function PointCountry(countryCode) {
		this.type = "country";
		this.countryCode = countryCode;
		this.point = countryGetPointFunc(countryCode);
	}

	/*
	 * points is a list of objects of PointXyz
	 * weight is the volume of trade
	 */
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

