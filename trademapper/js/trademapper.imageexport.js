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
		 * by setting its href attribute to a dataURL extracted from the map SVG.
		 *
		 * svgButton: element with an on() method which can be used to bind clicks
		 * pngButton: element with an on() method which can be used to bind clicks
		 * svgElement: DOM node; reference to the <svg> element containing the map
		 */
		init: function(svgButton, pngButton, svgElement) {
			// clicks on the SVG button export the SVG
			svgButton.on("click", this.exportSVG.bind(this));

			// clicks on the PNG button export the PNG
			pngButton.on("click", this.exportPNG.bind(this));

			this.$svgElement = $(svgElement);

			// for triggering the download
			this.link = document.createElement("a");
			this.link.style.display = "none";

			// for drawing the SVG onto, from where it can be downloaded
			this.canvas = document.createElement("canvas");

			// name given to file when downloaded
			this.svgDownloadFilename = "map.svg";
			this.pngDownloadFilename = "map.png";

			document.body.appendChild(this.link);
		},

		// clone the SVG element and append useful attributes to it which allow
		// it to be exported as a gif, SVG etc.
		// returns: an <svg> DOM element; note that this doesn't have any of the
		// event handlers of the original svg element
		cloneSVG: function () {
			// make a copy of the existing SVG element
			var newsvg = this.$svgElement.clone();

			var width = this.$svgElement.width();
			var height = this.$svgElement.height();

			// set some useful attributes on it
			newsvg.attr("version", 1.1);
			newsvg.attr("xmlns", "http://www.w3.org/2000/svg");

			// set its height and width: these are REQUIRED to be able to export
			// to gif in Firefox
			newsvg.attr("width", width);
			newsvg.attr("height", height);

			newsvg.width(width + "px");
			newsvg.height(height + "px");

			return newsvg;
		},

		download: function(dataURL, filename) {
			this.link.download = filename;
			this.link.href = dataURL;
			this.link.click();
			this.link.download = "";
			this.link.href = "";
		},

		// export the associated SVG element as a download
		exportSVG: function() {
			var dataURL = util.getSVGObjectURL(this.cloneSVG().get(0));
			this.download(dataURL, this.svgDownloadFilename);
		},

		// export the SVG element as a PNG download
		exportPNG: function() {
			var image = new Image();

			image.onload = function () {
				this.canvas.width = image.width;
				this.canvas.height = image.height;

				var ctx = this.canvas.getContext("2d");
				ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
				ctx.drawImage(image, 0, 0);

				var dataURL = this.canvas.toDataURL("image/png");
				this.download(dataURL, this.pngDownloadFilename);
			}.bind(this);

			var svg = this.cloneSVG().get(0);
			image.src = util.getSVGObjectURL(svg);
		},
	};
});
