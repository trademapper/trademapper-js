define([
	"jquery"
],

function($) {
	return {
		/**
		 * Constructor
		 *
		 * This creates a hidden link which allows a download to be emulated
		 * by settings its href attribute to a dataURL extracted from the map SVG.
		 *
		 * button: element with an on() method which can be used to bind clicks
		 * svgElement: DOM node; reference to the <svg> element containing the map
		 */
		init: function(button, svgElement, trademapper) {
			// clicks on the button export the SVG
			button.on("click", this.exportSvg.bind(this));

			this.$svgElement = $(svgElement);

			this.link = document.createElement("a");
			this.link.style.display = "none";

			// name given to file when downloaded
			this.link.download = "map.svg";

			document.body.appendChild(this.link);

			this.trademapper = trademapper;
		},

		// get a data URL for the current content of the SVG element
		getSvgDataUrl: function () {
			// make a copy of the existing SVG element
			var newsvg = this.$svgElement.clone();

			// set some useful attributes on it
			newsvg.attr("version", 1.1);
			newsvg.attr("xmlns", "http://www.w3.org/2000/svg");

			// set its height and width: these are REQUIRED to be able to export
			// to gif in Firefox
			newsvg.attr("width", this.trademapper.config.width);
			newsvg.attr("height", this.trademapper.config.height);

			var svgString = new XMLSerializer().serializeToString(newsvg.get(0));
			var blob = new Blob([svgString], {type: "image/svg+xml"});

			return window.URL.createObjectURL(blob);
		},

		// export the associated SVG element as a download
		exportSvg: function() {
			this.link.href = this.getSvgDataUrl();
			this.link.click();
		}
	};
});
