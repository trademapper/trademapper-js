define([],	function () {
	return function(url) {
		return "https://jsonp.nodejitsu.com/?url=" + encodeURIComponent(url);
	}
});

