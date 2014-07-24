require.config({
	baseUrl: 'js'
});

// initialise early
require(["trademapper"], function(tm) {
    tm.init(document.getElementById("mapcanvas"));
});

// once loaded, get to work
require(["trademapper", "window_loaded"], function(tm) {
});
