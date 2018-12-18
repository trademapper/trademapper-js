/*
 * Code to run the slider to go through the years
 */
define([
	"jquery",
	"d3",
	"util",
	// these extend the existing module so do them last and don't
	// bother giving them variables in the function call.
	"bootstrap-switch",
	"bootstrap-slider",
],
function($, d3, util) {
	"use strict";

	return {
		enabled: false,
		sectionDisableReason: "No data loaded yet",
		sliderEnabled: false,

		// reference to the bootstrap slider
		slider: null,

		enabledSwitchMessage: 'Switch between using the year range and the year slider',
		disabledSwitchMessage: 'You cannot use the year slider because: ',

		// functions to be set by trademapper.js
		showTradeForYear: null,
		showTradeForAllYears: null,
		enableDisableCallback: null,

		minYear: 0,
		maxYear: 0,
		currentYear: 0,
		yearColumnName: null,
		playInterval: 2000,  // ms

		// variables for the async sleep stuff
		isPlaying: false,
		intervalId: null,

		savedState: null,

		// save the current state of the year slider and switch so they can
		// be re-applied at a later date; this is used to reset them after
		// playing the video at a fast rate to export it as an image
		saveState: function () {
			this.savedState = {
				currentYear: this.currentYear,
				sliderEnabled: this.sliderEnabled,
				isPlaying: this.isPlaying,
			};
		},

		applySavedState: function () {
			if (this.savedState !== null) {
				this.currentYear = this.savedState.currentYear;
				this.setSliderValue(this.currentYear);

				this.sliderEnabled = this.savedState.sliderEnabled;
				this.setSliderState();

				if (this.sliderEnabled) {
					this.showTradeForYear(this.currentYear);
				} else {
					this.showTradeForAllYears();
				}

				if (this.savedState.isPlaying) {
					this.play();
				}
			}
		},

		disable: function(reason) {
			this.enabled = false;
			// TODO: do something with the reason ... bootstrap alert?
			this.sectionDisableReason = reason;
			this.minYear = this.maxYear = this.currentYear = 0;

			this.sliderEnabled = false;
			this.setSliderState();

			this.createInactiveSwitch();
		},

		enable: function(minYear, maxYear, currentYear) {
			if (!util.isInt(minYear)) {
				return;
			}

			this.minYear = minYear;
			this.maxYear = maxYear;
			this.currentYear = currentYear ? currentYear : minYear;

			this.enabled = true;
			this.sectionDisableReason = null;
			this.createActiveSwitch();

			this.configureSlider();
			this.setSliderState();
		},

		/*
		* when someone clicks on play or the slider, do the full enable, and
		* animate toggling the switch
		*/
		implicitEnableSlider: function() {
			if (this.sliderEnabled) { return; }

			// animate the switch to "on", 2nd true skips triggering event
			this.getSwitchElement().bootstrapSwitch('state', true, true);
			// enable the slider and play button
			this.sliderEnabled = true;
			this.getSectionElement().removeClass("disabled");
			// show data for first year
			this.currentYear = this.minYear;
			// disable the year range in the filterform
			this.enableDisableCallback(true);

			this.setSliderState();
		},

		play: function () {
			// reset year if at end
			if (this.currentYear === this.maxYear) {
				this.currentYear = this.minYear;
			}
			var incrementYearSlider = function() {
				this.incrementYearSlider();
			}.bind(this);
			this.intervalId = setInterval(incrementYearSlider, this.playInterval);
			this.togglePlayButton(true);
			// and do an increment immediately
			incrementYearSlider();

			this.isPlaying = true;
		},

		pause: function () {
			// if currently playing then pause
			if (this.intervalId !== null) {
				clearInterval(this.intervalId);
				this.intervalId = null;
			}
			this.togglePlayButton(false);
			this.isPlaying = false;
		},

		togglePlayButton: function(isPlaying) {
			var playButton = this.getPlayButtonElement();
			var playButtonText = this.getPlayButtonTextElement();

			if (isPlaying) {
				playButton.attr('title', 'pause');
				// this produces two vertical bars - the pause symbol
				playButtonText.html("&#9616;&#9616;");
				playButtonText.removeClass("paused");
				playButtonText.addClass("playing");
			} else {
				playButton.attr('title', 'play');
				// unicode triangle
				playButtonText.html("▶");
				playButtonText.removeClass("playing");
				playButtonText.addClass("paused");
			}
		},

		playPauseYearSlider: function() {
			// if not enabled, do nothing
			if (this.enabled === false) { return; }

			// if data hasn't been loaded, do nothing
			if (this.minYear === 0) { return; }

			this.implicitEnableSlider();

			// is null if not currently playing
			if (this.isPlaying) {
				this.pause();
			} else {
				this.play();
			}
		},

		switchChange: function(switchElement) {
			var section = this.getSectionElement();
			if (switchElement.is(':checked')) {
				this.sliderEnabled = true;
				section.removeClass("disabled");
				this.enableDisableCallback(true);
				this.showTradeForYear(this.currentYear);
			} else {
				this.sliderEnabled = false;
				// if currently playing then pause
				if (this.intervalId) {
					clearInterval(this.intervalId);
					this.intervalId = null;
					this.togglePlayButton(false);
				}
				section.addClass("disabled");
				// go back to showing data for all years (with filter settings)
				this.enableDisableCallback(false);
				this.showTradeForAllYears();
			}

			this.setSliderState();
		},

		incrementYearSlider: function() {
			this.setSliderValue(this.currentYear);
			this.showTradeForYear(this.currentYear);
			this.currentYear++;
			if (this.currentYear > this.maxYear) {
				clearInterval(this.intervalId);
				this.intervalId = null;
				this.togglePlayButton(false);
				this.currentYear = this.maxYear;
			}
		},

		getSectionElement: function () {
			return $("[data-role='change-over-time-section']");
		},

		getPlayButtonElement: function () {
			return $("[data-role='change-over-time-play-button']");
		},

		getPlayButtonTextElement: function () {
			return $("[data-role='change-over-time-play-button-text']");
		},

		getSwitchElement: function () {
			return $("[data-role='change-over-time-switch']");
		},

		getSliderElement: function() {
			return $("[data-role='change-over-time-slider']");
		},

		setSliderValue: function (value) {
			if (util.isInt(value) && this.slider !== null) {
				this.slider.slider('setValue', value);
			}
		},

		create: function() {
			// make a switch to enable/disable
			this.createInactiveSwitch();

			// link the play button to a function
			this.getPlayButtonElement().on("click", this.playPauseYearSlider.bind(this));

			// make a blank slider
			this.createSlider()
		},

		createInactiveSwitch: function() {
			var sliderSwitch = this.getSwitchElement().bootstrapSwitch();
			sliderSwitch.on('switchChange.bootstrapSwitch', function() {} );
			sliderSwitch.bootstrapSwitch('state', false, false);
			sliderSwitch.bootstrapSwitch('readonly', true);
			sliderSwitch.attr('title', this.disabledSwitchMessage + this.sectionDisableReason);
		},

		createActiveSwitch: function() {
			var moduleThis = this;
			var sliderSwitch = this.getSwitchElement().bootstrapSwitch();
			sliderSwitch.bootstrapSwitch('readonly', false);
			sliderSwitch.on('switchChange.bootstrapSwitch', function() {
				var switchElement = $(this);
				moduleThis.switchChange(switchElement);
			});
			sliderSwitch.attr('title', this.enabledSwitchMessage);
		},

		createSlider: function(options) {
			if (this.slider !== null) {
				this.slider.slider('destroy');
				this.slider = null;
			}

			if (!options) {
				options = {
					ticks: [0],
					enabled: false
				};
			}

			this.slider = this.getSliderElement().slider(options);

			this.slider.on('change', function(event) {
				var year = event.value['newValue'];
				this.implicitEnableSlider();
				this.currentYear = year;
				this.showTradeForYear(year);
			}.bind(this));

			return this.slider;
		},

		configureSlider: function() {
			var years = [];
			for (var i = this.minYear; i <= this.maxYear; i++) {
				years.push(i);
			}

			var opts = {
				step: 1,
				ticks: years,
				ticks_labels: years,
				enabled: true
			};

			this.createSlider(opts);
			this.setSliderValue(this.currentYear);
		},

		setSliderState: function() {
			if (this.slider === null) { return ; }

			if (this.sliderEnabled) {
				this.slider.slider('enable');
			}
			else {
				this.slider.slider('disable');
			}
		},
	};
});
