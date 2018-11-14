define([
	"jquery"
],

function($) {
	return {
		/**
		 * Constructor
		 *
		 * This creates an off-screen canvas for drawing the SVG to, which is wholly
		 * managed by this component, never added to the DOM, and never visible to
		 * the user.
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
		},

		reset: function() {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		},

		exportSvg: function() {
			console.log("export button was pressed");

			this.canvas.height = this.svgElement.height();
			this.canvas.width = this.svgElement.width();

			this.reset();
			this.ctx.moveTo(0, 0);
			this.ctx.lineTo(200, 100);
			this.ctx.stroke();
		}
	};
});
