define(["gifshot", "jquery"], function (gifshot, $) {

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

			var dataUrls = [];
			for (var year = minYear; year <= maxYear; year++) {
				this.trademapper.showTradeForYear(year);
				dataUrls.push(this.trademapper.imageExport.getSvgDataUrl());
			}

			gifshot.createGIF({
				images: dataUrls,
				gifHeight: height,
				gifWidth: width,
				frameDuration: 20,
				numWorkers: 4,
			}, function(obj) {
				if (!obj.error) {
					var animatedImage = document.createElement('img');
					animatedImage.src = obj.image;
					document.body.appendChild(animatedImage);
				} else {
					console.error(obj.error);
				}
			});

			this.trademapper.yearslider.applySavedState();
		}
	}

});
