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
	sliderEnabled: false,
	yearSlider: null,
	showTradeForYear: null,

	minYear: 0,
	maxYear: 0,
	yearColumnName: null,
	playInterval: 2000,  // ms

	// variables for the async sleep stuff
	currentYear: null,
	intervalId: null,


	disable: function() {
		this.sectionEnabled = false;
		var section = document.querySelector(".change-over-time-section");
		section.classList.add("disabled");
	},

	enable: function() {
		this.sectionEnabled = true;
		var section = document.querySelector(".change-over-time-section");
		section.classList.remove("disabled");
	},

	changePlayButton: function(isPlaying) {
		var playButton = document.querySelector(".change-over-time.play-button"),
			playButtonText = document.querySelector(".change-over-time.play-button-text");

		if (isPlaying) {
			// this produces two vertical bars - the pause symbox
			playButton.setAttribute('title', 'pause');
			playButtonText.innerHTML = "&#9616;&#9616;";
			playButtonText.classList.remove("paused");
			playButtonText.classList.add("playing");
		} else {
			// unicode triangle
			playButton.setAttribute('title', 'play');
			playButtonText.textContent = "▶";
			playButtonText.classList.remove("playing");
			playButtonText.classList.add("paused");
		}
	},

	playPauseYearSlider: function() {
		// if not enabled, do nothing
		if (this.sectionEnabled === false || this.sliderEnabled === false) { return; }
		// don't play if setYears() hasn't been called
		if (this.minYear === 0) { return; }
		// is null if not currently playing
		if (this.intervalId === null) {
			this.currentYear = this.minYear;
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
			this.createSliderWithYears();
		} else {
			moduleThis.sliderEnabled = false;
			section.classList.add("disabled");
			this.createSliderBlank();
		}
	},

	incrementYearSlider: function() {
		this.setYears(this.minYear, this.maxYear, this.currentYear);
		this.showTradeForYear(this.currentYear);
		this.currentYear++;
		if (this.currentYear > this.maxYear) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			this.changePlayButton(false);
		}
	},

	create: function() {
		// make a switch to enable/disable
		// TODO: link it to a function to do disable/enable
		var moduleThis = this;
		var $sliderSwitch = $("input[name='change-over-time-checkbox']");
		$sliderSwitch.bootstrapSwitch();
		$sliderSwitch.on('switchChange.bootstrapSwitch', function() {
			moduleThis.switchChange(moduleThis, $(this));
		});

		// link the play button to a function
		var playPauseCallback = function() {
			this.playPauseYearSlider();
		}.bind(this);
		d3.select(".change-over-time.play-button").on("click", playPauseCallback);

		// create the slider - years are added when CSV is loaded
		this.createSliderBlank();
	},

	setYears: function(minYear, maxYear, selectedYear) {
		this.minYear = minYear;
		this.maxYear = maxYear;
		this.selectedYear = selectedYear ? selectedYear: minYear;
		if (this.sliderEnabled) {
			this.createSliderWithYears();
		} else {
			this.createSliderBlank();
		}
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
			this.showTradeForYear(year);
		}.bind(this);

		var sliderDiv = this.clearSliderDiv();
		this.yearSlider = sliderDiv.call(
			d3.slider()
			.axis(true)
			.min(this.minYear)
			.max(this.maxYear)
			.step(1)
			.value(this.selectedYear)
			.on("slide", setYearCallback)
		);
	},

	};
});
