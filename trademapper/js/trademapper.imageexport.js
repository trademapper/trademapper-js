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
		 * This creates an off-screen canvas for drawing the SVG to, which is wholly
		 * managed by this component, never added to the DOM, and never visible to
		 * the user.
		 *
     * It also creates a hidden link which allows a download to be emulated,
		 * and an Image object for loading the SVG into.
		 *
		 * button: element with an on() method which can be used to bind clicks
		 * svgElement: DOM node; reference to the <svg> element containing the map
		 */
		init: function(button, svgElement) {
			// clicks on the button export the SVG
			button.on('click', this.exportSvg.bind(this));

			this.svgElement = $(svgElement);
			this.canvas = document.createElement("canvas");
			this.ctx = this.canvas.getContext("2d");

			this.link = document.createElement("a");
			this.image = new Image();
		},

		// export the associated SVG element
		exportSvg: function() {
			var self = this;

			this.canvas.height = this.svgElement.height();
			this.canvas.width = this.svgElement.width();

			this.image.onload = function() {
				self.ctx.drawImage(self.image, 0, 0);

				self.link.download = "sample.png";
				self.link.href = self.canvas.toDataURL("image/png");
				self.link.click();
			};

			this.svgElement.attr("version", 1.1);
			this.svgElement.attr("xmlns", "http://www.w3.org/2000/svg");

			var svgString = btoa(this.svgElement.get(0).outerHTML);
			this.image.src = DATA_URL_HEADER + svgString;
		}
	};
});
