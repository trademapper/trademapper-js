/*
 * Code to run the slider to go through the years
 */
define([
	"jquery",
	"d3",
	// these requires extend the existing modules so do them last and don't
	// bother giving them variables in the function call.
	"bootstrap-switch",
	"d3.slider"
],
function($, d3) {
	"use strict";

	return {
	sectionEnabled: false,
	sectionDisableReason: "No data loaded yet",
	sliderEnabled: false,
	yearSlider: null,

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
	intervalId: null,

	disableSection: function(reason) {
		this.sectionEnabled = false;
		// TODO: do something with the reason ... bootstrap alert?
		this.sectionDisableReason = reason;
		var section = document.querySelector(".change-over-time-section");
		section.classList.add("disabled");
		this.minYear = this.maxYear = this.currentYear = 0;
		this.createInactiveSwitch();
	},

	enableSection: function(minYear, maxYear, currentYear) {
		this.minYear = minYear;
		this.maxYear = maxYear;
		this.currentYear = currentYear ? currentYear: minYear;

		this.sectionEnabled = true;
		this.sectionDisableReason = null;
		var section = document.querySelector(".change-over-time-section");
		section.classList.remove("disabled");
		this.createActiveSwitch();

		this.createSliderWithYears();
	},

	/*
	 * when someone clicks on play or the slider, do the full enable, and
	 * animate toggling the switch
	 */
	implicitEnableSlider: function() {
		if (this.sliderEnabled) { return; }
		// animate the switch to "on", 2nd true skips triggering event
		var $sliderSwitch = $("input[name='change-over-time-checkbox']");
		$sliderSwitch.bootstrapSwitch('state', true, true);
		// enable the slider and play button
		this.sliderEnabled = true;
		var section = document.querySelector(".change-over-time.slider-section");
		section.classList.remove("disabled");
		// show data for first year
		this.currentYear = this.minYear;
		// disable the year range in the filterform
		this.enableDisableCallback(true);
	},

	changePlayButton: function(isPlaying) {
		var playButton = document.querySelector(".change-over-time.play-button"),
			playButtonText = document.querySelector(".change-over-time.play-button-text");

		if (isPlaying) {
			playButton.setAttribute('title', 'pause');
			// this produces two vertical bars - the pause symbol
			playButtonText.innerHTML = "&#9616;&#9616;";
			playButtonText.classList.remove("paused");
			playButtonText.classList.add("playing");
		} else {
			playButton.setAttribute('title', 'play');
			// unicode triangle
			playButtonText.textContent = "▶";
			playButtonText.classList.remove("playing");
			playButtonText.classList.add("paused");
		}
	},

	playPauseYearSlider: function() {
		// if not enabled, do nothing
		if (this.sectionEnabled === false) { return; }
		// don't play if enable() hasn't been called
		if (this.minYear === 0) { return; }

		this.implicitEnableSlider();
		// is null if not currently playing
		if (this.intervalId === null) {
			// reset year if at end
			if (this.currentYear === this.maxYear) {
				this.currentYear = this.minYear;
			}
			var incrementYearSlider = function() {
				this.incrementYearSlider();
			}.bind(this);
			this.intervalId = setInterval(incrementYearSlider, this.playInterval);
			this.changePlayButton(true);
			// and do an increment immediately
			incrementYearSlider();
		} else {
			// if currently playing then pause
			clearInterval(this.intervalId);
			this.intervalId = null;
			this.changePlayButton(false);
		}
	},

	switchChange: function(moduleThis, $this) {
		var section = document.querySelector(".change-over-time.slider-section");
		if ($this.is(':checked')) {
			moduleThis.sliderEnabled = true;
			section.classList.remove("disabled");
			this.enableDisableCallback(true);
			this.showTradeForYear(this.currentYear);
		} else {
			moduleThis.sliderEnabled = false;
			// if currently playing then pause
			if (this.intervalId) {
				clearInterval(this.intervalId);
				this.intervalId = null;
				this.changePlayButton(false);
			}
			// disable the slider
			section.classList.add("disabled");
			// go back to showing data for all years (with filter settings)
			this.enableDisableCallback(false);
			this.showTradeForAllYears();
		}
	},

	incrementYearSlider: function() {
		// this line will recreate the slider with the bit pointing to the
		// next year
		this.createSliderWithYears();
		this.showTradeForYear(this.currentYear);
		this.currentYear++;
		if (this.currentYear > this.maxYear) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			this.changePlayButton(false);
			this.currentYear = this.maxYear;
		}
	},

	createActiveSwitch: function() {
		var moduleThis = this;
		var $sliderSwitch = $("input[name='change-over-time-checkbox']");
		$sliderSwitch.bootstrapSwitch('readonly', false);
		$sliderSwitch.on('switchChange.bootstrapSwitch', function() {
			moduleThis.switchChange(moduleThis, $(this));
		});
		document.querySelector(".change-over-time-switch")
			.setAttribute('title', this.enabledSwitchMessage);
	},

	createInactiveSwitch: function() {
		var $sliderSwitch = $("input[name='change-over-time-checkbox']");
		$sliderSwitch.on('switchChange.bootstrapSwitch', function() {} );
		$sliderSwitch.bootstrapSwitch('state', false, false);
		$sliderSwitch.bootstrapSwitch('readonly', true);
		document.querySelector(".change-over-time-switch")
			.setAttribute('title', this.disabledSwitchMessage + this.sectionDisableReason);
	},

	create: function() {
		// make a switch to enable/disable
		this.createInactiveSwitch();

		// link the play button to a function
		var playPauseCallback = function() {
			this.playPauseYearSlider();
		}.bind(this);
		d3.select(".change-over-time.play-button").on("click", playPauseCallback);

		// create the slider - years are added when CSV is loaded
		this.createSliderBlank();
	},

	clearSliderDiv: function() {
		var sliderDiv = d3.select(".change-over-time.year-slider");
		sliderDiv.selectAll("*").remove();
		return sliderDiv;
	},

	createSliderBlank: function() {
		var sliderDiv = this.clearSliderDiv();
		this.yearSlider = sliderDiv.call(d3.slider());
	},

	createSliderWithYears: function() {
		var setYearCallback = function(ext, year) {
			this.implicitEnableSlider();
			this.currentYear = year;
			this.showTradeForYear(year);
		}.bind(this);

		var sliderDiv = this.clearSliderDiv();
		this.yearSlider = sliderDiv.call(
			d3.slider()
			.axis(true)
			.min(this.minYear)
			.max(this.maxYear)
			.step(1)
			.value(this.currentYear)
			.on("slide", setYearCallback)
		);
	},

	};
});
