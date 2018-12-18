// Spinner modal for when topojson files are loading;
// this overlays the whole screen to prevent the map being moved or zoomed
// while processing is on-going
define(["jquery", "text!../fragments/spinnerskeleton.html"], function ($, html) {

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
		$(element).append(modal);

		var messagePara = modal.find("[data-role='tm-modal-spinner-message']");

		return {
			show: function () {
				modal.attr("data-visible", "true");
			},

			hide: function () {
				modal.attr("data-visible", "false");
				this.setMessage("");
			},

			// set an additional message on the overlay; if message is falsy,
			// hide the message paragraph, otherwise show it
			setMessage: function (text) {
				if (!text) {
					text = "";
				}

				messagePara.text(text);

				messagePara.attr("data-visible", text !== "");
			},
		};
	};

});
