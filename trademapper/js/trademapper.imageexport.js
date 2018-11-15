define([
	"jquery"
],

function($) {
	const DATA_URL_HEADER = "data:image/svg+xml;base64,";
	const COUNTRY_FILL = "#DFDFDF";
	const OCEAN_FILL = "#FFF";
	const DISPUTED_FILL = "rgba(255, 0, 0, 0.3)";

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
		init: function(button, svgElement) {
			// clicks on the button export the SVG
			button.on('click', this.exportSvg.bind(this));

			this.svgElement = $(svgElement);

			this.link = document.createElement("a");
			this.link.style.display = "none";
			this.link.download = "map.svg";
			document.body.appendChild(this.link);
		},

		// export the associated SVG element
		exportSvg: function() {
			this.svgElement.attr("version", 1.1);
			this.svgElement.attr("xmlns", "http://www.w3.org/2000/svg");

			var svgString = btoa(this.svgElement.get(0).outerHTML);
			this.link.href = DATA_URL_HEADER + svgString;
			this.link.click();
		}
	};
});
