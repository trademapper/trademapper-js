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
	yearSlider: null,
	showTradeForYear: null,

	minYear: 0,
	maxYear: 0,
	yearColumnName: null,
	playInterval: 2000,  // ms

	// variables for the async sleep stuff
	currentYear: null,
	intervalId: null,

	changePlayButton: function(isPlaying) {
		var playButton = document.querySelector(".change-over-time.play-button");
		if (isPlaying) {
			playButton.textContent = "pause";
		} else {
			playButton.textContent = "play";
		}
	},

	playYearSlider: function() {
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
		$("[name='change-over-time-checkbox']").bootstrapSwitch();

		// link the play button to a function
		var playCallback = function() {
			this.playYearSlider();
		}.bind(this);
		d3.select(".change-over-time.play-button").on("click", playCallback);

		// create the slider - years are added when CSV is loaded
		var sliderDiv = d3.select(".change-over-time.year-slider");
		sliderDiv.selectAll("*").remove();
		this.yearSlider = sliderDiv.call(d3.slider());
	},

	setYears: function(minYear, maxYear, selectedYear) {
		this.minYear = minYear;
		this.maxYear = maxYear;
		if (selectedYear === null) {
			selectedYear = minYear;
		}
		var sliderDiv = d3.select(".change-over-time.year-slider");
		var setYearCallback = function(ext, year) {
			this.showTradeForYear(year);
		}.bind(this);

		sliderDiv.selectAll("*").remove();
		this.yearSlider = sliderDiv.call(
			d3.slider()
			.axis(true)
			.min(minYear)
			.max(maxYear)
			.step(1)
			.value(selectedYear)
			.on("slide", setYearCallback)
		);
	},

	};
});
