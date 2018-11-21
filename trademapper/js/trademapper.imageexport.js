define([
	"jquery",
	"util"
],

function($, util) {
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

		// clone the SVG element and append useful attributes to it which allow
		// it to be exported as a gif or SVG
		// returns: an <svg> DOM element; note that this doesn't have any of the
		// event handlers of the original svg element
		cloneSvg: function () {
			// make a copy of the existing SVG element
			var newsvg = this.$svgElement.clone();

			// set some useful attributes on it
			newsvg.attr("version", 1.1);
			newsvg.attr("xmlns", "http://www.w3.org/2000/svg");

			// set its height and width: these are REQUIRED to be able to export
			// to gif in Firefox
			newsvg.attr("width", this.trademapper.config.width);
			newsvg.attr("height", this.trademapper.config.height);

			return newsvg.get(0);
		},

		// get a data URL for the current content of the SVG element
		getSvgDataUrl: function () {
			return util.svgToObjectURL(this.cloneSvg());
		},

		// export the associated SVG element as a download
		exportSvg: function() {
			this.link.href = this.getSvgDataUrl();
			this.link.click();
		}
	};
});
