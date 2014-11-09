define([],	function () {
	return function(url) {
		return "http://www.corsproxy.com/" + url.replace(/^https?:\/\//, "")
	}
});

