// Progress bar modal for when gif is exporting;
// this overlays the whole screen to prevent the map being moved or zoomed
// while processing is on-going
define(["jquery", "text!../fragments/progressskeleton.html"], function ($, html) {

	/**
	 * Factory function to add a progress modal to a DOM element.
	 *
	 * element: DOM element to attach the overlay to; best if this is the
	 * <body> (the default if not specified)
	 */
	return function (element) {
		if (element === null) {
			element = document.body;
		}

		var modal = $(html);
		var progress = modal.find("[role='progressbar']");
		$(element).append(modal);

		return {
			show: function () {
				modal.attr("data-visible", "true");
			},

			hide: function () {
				modal.attr("data-visible", "false");
			},

			// set progress percentage
			setProgress: function (percentage) {
				progress.css("width", percentage + "%");
				progress.attr("aria-value-now", percentage);
			},
		}
	};

});
