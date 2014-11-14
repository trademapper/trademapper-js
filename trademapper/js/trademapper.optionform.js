/*
 * JS to manage the options form
 */
define([], function() {
	"use strict";

	return {
		optionsUpdateCallback: null,

		init: function(updateCallback) {
			this.optionsUpdateCallback = updateCallback;
		},

		setFormFromConfig: function(currentConfig) {
		},

		makeConfigFromForm: function() {
			var config = {};
			this.optionsUpdateCallback(config);
		}
	};
});
