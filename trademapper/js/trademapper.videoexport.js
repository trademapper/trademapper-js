define(["gif", "jquery"], function (GIF, $) {

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

			console.log('height: ' + height + '; width: ' + width);

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

			for (var year = minYear; year <= maxYear; year++) {
				this.trademapper.showTradeForYear(year);
				var image = new Image();
				image.onload = onload;
				images.push(image);
				image.src = this.trademapper.imageExport.getSvgDataUrl();
			}

			this.trademapper.yearslider.applySavedState();
		}
	}

});
