define(function () {
	// prototype to load multiple image URLs into Image objects
	return function () {
		// load all the URLs in the array imageURLs (data URLs or http URLs)
		// returns a Promise which resolves to an array of loaded Image objects,
		// whose order matches imageURLs
		this.load = function (imageURLs) {
			// an ordered array of the images; this ensures that when all the images
			// have loaded, we process them into the gif in the correct sequence
			var images = [];

			var promises = [];

			for (var i = 0; i < imageURLs.length; i++) {
				var image = new Image();

				promises.push(new Promise(function (resolve, reject) {
					image.onload = resolve;
				}));

				images.push(image);
				image.src = imageURLs[i];
			}

			return Promise.all(promises).then(
				function () {
					return Promise.resolve(images);
				},
				function (error) {
					return Promise.reject("unable to load all image URLs");
				}
			);
		};

		return this;
	};
});
