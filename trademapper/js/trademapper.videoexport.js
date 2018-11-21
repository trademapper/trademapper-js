define(["gif", "jquery", "util"], function (GIF, $, util) {

	return {
		init: function (button, trademapper) {
			this.trademapper = trademapper;
			button.on('click', this.run.bind(this));

			// to handle the download
			this.link = document.createElement("a");
			this.link.style.display = "none";

			// name given to file when downloaded
			this.link.download = "animated_map.gif";

			document.body.appendChild(this.link);
		},

		run: function () {
			var height = this.trademapper.config.height;
			var width = this.trademapper.config.width;

			this.trademapper.yearslider.saveState();

			var minYear = this.trademapper.minMaxYear[0];
			var maxYear = this.trademapper.minMaxYear[1];

			var gif = new GIF({
				workers: 4,
				quality: 10,
				height: height,
				width: width,
				workerScript: "./js/lib/gif.worker.js",
				repeat: -1,
			});

			var self = this;

			gif.on("finished", function (blob) {
				self.link.href = window.URL.createObjectURL(blob);
				self.link.click();
			});

			var numImagesLoaded = 0;
			var numImagesExpected = maxYear - minYear + 1;
			var images = [];

			var onload = function () {
				numImagesLoaded++;
				if (numImagesLoaded === numImagesExpected) {
					for (var i = 0; i < images.length; i++) {
						gif.addFrame(images[i], { delay: 2000 });
					}
					gif.render();
				}
			};

			var yearContainer = $("<svg class='year-container' x='0' y='0'>" +
				"<text class='year-text' x='0.25em' y='1em'></text>" +
				"</svg>");
			var yearText = yearContainer.find('text');

			for (var year = minYear; year <= maxYear; year++) {
				this.trademapper.showTradeForYear(year);
				var image = new Image();
				image.onload = onload;
				images.push(image);

				var svgElement = this.trademapper.imageExport.cloneSvg();

				// TODO add the year text box somewhere
				svgElement.append(yearContainer);
				yearText.html(year);

				image.src = util.svgToObjectURL(svgElement.get(0));
			}

			this.trademapper.yearslider.applySavedState();
		}
	}

});
