define(["gif", "jquery", "util"], function (GIF, $, util) {

	return {
		// button: button which when clicked initiates the export
		// trademapper: trademapper instance
		init: function (button, trademapper) {
			var self = this;

			this.trademapper = trademapper;

			// provide a way to trigger events, even though this component has no
			// DOM element of its own
			this.eventFirer = $({});

			button.on("click", function () {
				self.eventFirer.trigger("start");
				setTimeout(self.run.bind(self), 0);
			});

			// to handle the download
			this.link = document.createElement("a");
			this.link.style.display = "none";

			// name given to file when downloaded
			this.link.download = "animated_map.gif";

			document.body.appendChild(this.link);
		},

		// proxy on() calls onto the eventFirer
		on: function (event, handler) {
			this.eventFirer.on(event, handler);
		},

		/**
		 * triggers the following events (can be bound to via on()):
		 *	 start => video export started
		 *	 progress => percentage of frames exported to the gif; note that there
		 *		 is a further step to render the gif once this is done, so total
		 *		 progress of the whole export is not exactly equal to the value
		 *		 sent with this event
		 *	 end => video export finished
		 */
		run: function () {
			var self = this;

			var height = this.trademapper.config.height;
			var width = this.trademapper.config.width;

			this.trademapper.yearslider.saveState();

			var minYear = this.trademapper.minMaxYear[0];
			var maxYear = this.trademapper.minMaxYear[1];

			var numImagesLoaded = 0;
			var numImagesExpected = maxYear - minYear + 1;
			var images = [];

			var gif = new GIF({
				workers: 6,
				quality: 5,
				height: height,
				width: width,
				workerScript: "./js/lib/gif.worker.js",
				repeat: -1,
			});

			gif.on("finished", function (blob) {
				self.link.href = window.URL.createObjectURL(blob);
				self.link.click();
				self.eventFirer.trigger("progress", 100);
				self.eventFirer.trigger("end");
			});

			// this is called each time an SVG snapshot is exported to an image,
			// and counts the number of images which are ready; when they are done,
			// they are added to the output gif as frames
			var onload = function () {
				numImagesLoaded++;
				if (numImagesLoaded === numImagesExpected) {
					for (var i = 0; i < images.length; i++) {
						gif.addFrame(images[i], { delay: 2000 });
						self.eventFirer.trigger("progress", parseInt((i / images.length) * 100));
					}
					gif.render();
				}
			};

			var yearContainer = $("<svg class='year-container' x='0' y='0'>" +
				"<text class='year-text' x='0.25em' y='1em'></text>" +
				"</svg>");
			var yearText = yearContainer.find("text");

			// step through the years in the data, exporting the SVG to an image
			// data URL at each step
			for (var year = minYear; year <= maxYear; year++) {
				this.trademapper.showTradeForYear(year);
				var image = new Image();
				image.onload = onload;
				images.push(image);

				var svgElement = this.trademapper.imageExport.cloneSvg();

				// add the year text box in the top-left corner
				svgElement.append(yearContainer);
				yearText.html(year);

				image.src = util.svgToObjectURL(svgElement.get(0));
			}

			this.trademapper.yearslider.applySavedState();
		}
	}

});
