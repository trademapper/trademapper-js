/*
 * The main trademapper library
 *
 * trademapper.js is the main file - it loads and configures the other
 * trademapper files, including setting callbacks.  It is set up by calling
 * the `init()` function which takes the following arguments:
 * 
 * - mapId - the id of the HTML element where the map should be inserted
 * - fileFormElementId - the id of the HTML element where the file form should
 *   be inserted.  (The file form is the form where you specify the file to use).
 * - filterFormElementId - the id of the HTML element where the filter form
 *   should be inserted.  (The filter form allows you to filter the data once it
 *   is loaded, so only a subset of the data is displayed on the map).
 * - config - an object with various other config elements.  An empty object is fine.
 * 
 * The config has default values which can be seen in the `defaultConfig` object
 * 
 * The init function also checks the URL parameters.
 */
define(
	[
		"trademapper.arrows",
		"trademapper.csv",
		"trademapper.filterform",
		"trademapper.mapper",
		"trademapper.route",
		"util",
		"d3",
		"jquery",
		"text!../fragments/filterskeleton.html",
		"text!../fragments/csvformskeleton.html",
		"text!../fragments/toolbarskeleton.html",
		"text!../fragments/options-skeleton.html"
	],
	function(arrows, csv, filterform, mapper, route, util,
			 d3, $,
			 filterSkeleton, csvFormSkeleton, toolbarSkeleton, optionsSkeleton) {
	"use strict";

	return {
	config: null,
	mapRootElement: null,
	fileFormElement: null,
	filterFormElement: null,
	toolbarElement: null,
	tooltipElement: null,
	optionsElement: null,
	fileInputElement: null,
	tmsvg: null,
	svgDefs: null,
	zoomg: null,
	controlg: null,
	currentCsvData: null,
	currentCsvType: null,
	currentUnit: null,
	queryString: null,

	defaultConfig: {
			ratio: 0.86,
			arrowColours: {
				opacity: 0.6,
				pathStart: "rgba(0,0,0,1)",
				pathEnd: "rgba(0,0,0,0.4)"
			},
			pointTypeSize: {
				origin: 6,
				exporter: 4.5,
				transit: 3.2,
				importer: 2.5
			},
			minArrowWidth: 1,
			maxArrowWidth: 25,
			arrowType: "plain-arrows"  // could be "plain-arrows" or "flowmap"
		},

	init: function(mapId, fileFormElementId, filterFormElementId, tmConfig) {
		this.queryString = util.queryString();
		this.mapRootElement = d3.select(mapId);
		this.fileFormElement = d3.select(fileFormElementId);
		this.filterFormElement = d3.select(filterFormElementId);
		this.setConfigDefaults(tmConfig);

		this.createCsvOnlyForm();

		this.toolbarElement = this.mapRootElement.append("div")
			.attr("id", "map-toolbar")
			.html(toolbarSkeleton);

		this.tmsvg = this.mapRootElement.insert("svg")
			.attr("width", this.config.width)
			.attr("height", this.config.height)
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "0 -120 900 500");
		this.svgDefs = this.tmsvg.append("defs");
		this.zoomg = this.tmsvg.append("g").attr("class", "zoomgroup");
		// append a background rectangle so mouse scroll zoom works over sea
		this.zoomg.append("rect")
			.attr("width", "150%")
			.attr("height", "150%")
			.attr("y", "-150")
			.attr("class", "mapocean");
		this.controlg = this.tmsvg.append("g").attr("class", "controlgroup");

		this.tooltipElement = this.mapRootElement.append("div")
			.attr("id", "maptooltip");
		this.optionsElement = d3.select('body').append("div")
		//this.optionsElement = this.mapRootElement.append("div")
			.attr("id", "map-options")
			.attr("class", "modal fade")
			.attr("role", "dialog")
			.attr("aria-hidden", "true")
			.html(optionsSkeleton);

		// need to init mapper before arrows otherwise the map is on top of
		// the arrows
		mapper.init(this.zoomg, this.controlg, this.svgDefs, this.config);
		arrows.init(this.tmsvg, this.zoomg, this.svgDefs, '#maptooltip', this.config.arrowColours,
			this.config.minArrowWidth, this.config.maxArrowWidth, this.config.pointTypeSize,
			mapper.countryCodeToInfo);

		// set up the various callbacks we need to link things together
		var moduleThis = this;
		csv.init(
			function(csvType, csvData) { moduleThis.csvLoadedCallback(csvType, csvData); },
			function(csvType, csvData, filters) { moduleThis.filterLoadedCallback(csvType, csvData, filters); },
			function(msg) { moduleThis.csvLoadErrorCallback(msg); });

		route.setCountryGetPointFunc(function(countryCode) {return mapper.countryCentrePoint(countryCode);});
		route.setLatLongToPointFunc(function(latLong) {return mapper.latLongToPoint(latLong);});
		filterform.formChangedCallback = function(columnName) {return moduleThis.filterformChangedCallback(columnName); };
		this.setUpAsideToggle();
		this.setUpOptionsDialog();

		if (this.queryString.hasOwnProperty("loadcsv")) {
			this.loadCsvFromUrl();
		}
	},

	setConfigDefaults: function(tmConfig) {
		this.config = tmConfig || {};

		// set defaults for all
		for (var key in this.defaultConfig) {
			if (this.defaultConfig.hasOwnProperty(key)) {
				this.config[key] = this.config[key] || this.defaultConfig[key];
			}
		}

		if (this.queryString.hasOwnProperty("arrowtype")) {
			if (this.queryString.arrowtype === "spiral-tree") {
				// convert legacy name to new name
				this.config.arrowType = "flowmap";
			} else if (['plain-arrows', 'flowmap'].indexOf(this.queryString.arrowtype) !== -1) {
				this.config.arrowType = this.queryString.arrowtype;
			} else {
				console.log("Unknown arrowtype in query string: " + this.queryString.arrowtype);
			}
		}
		if (this.queryString.hasOwnProperty("maxarrowwidth")) {
			var maxArrowWidth = parseInt(this.queryString.maxarrowwidth);
			if (maxArrowWidth > 0) {
				this.config.maxArrowWidth = maxArrowWidth;
			}
		}
		if (this.queryString.hasOwnProperty("minarrowwidth")) {
			var minArrowWidth = parseInt(this.queryString.minarrowwidth);
			if (minArrowWidth > 0) {
				this.config.minArrowWidth = minArrowWidth;
			}
		}

		// work out some stuff from the size of the element we're attached to
		if (!this.config.hasOwnProperty("width")) {
			this.config.width = parseInt(this.mapRootElement.style('width'));
		}
		if (!this.config.hasOwnProperty("height")) {
			this.config.height = this.config.width * this.config.ratio;
		}
	},

	setUpAsideToggle: function() {
		// TODO: make the document element id configurable
		var filterToggle = document.getElementById('filter-toggle'),
			filterPanel = document.getElementById('filter-panel');

		filterToggle.onclick = function() {
			filterPanel.classList.toggle('toggled');
			if (filterPanel.classList.contains('toggled')) {
				filterToggle.textContent = "Show filters";
			} else {
				filterToggle.textContent = "Hide filters";
			}
		};
	},

	setUpOptionsDialog: function() {
		var optionsSpan = document.querySelector('.tool-icons > .options'),
			optionsPanel = $('#map-options');
			//optionsPanel = document.getElementById('map-options');

		optionsSpan.onclick = function() {
			//optionsPanel.classList.remove('hidden');
			optionsPanel.modal('show');
			// the options panel will have it's own close button
		};
	},

	loadCsvFromUrl: function() {
		var csvUrl = decodeURIComponent(this.queryString.loadcsv);
		csv.loadCSVUrl(csvUrl);
	},

	showNowWorking: function() {
		console.log("start working");
	},

	stopNowWorking: function() {
		console.log("work finished");
	},

	createCsvOnlyForm: function() {
		this.fileFormElement.html(csvFormSkeleton);
		this.fileInputElement = this.fileFormElement.select("#fileinput");
		csv.setFileInputElement(this.fileInputElement);
		csv.setUrlInputElement(this.fileFormElement.select("#urlinput"),
							this.fileFormElement.select("#url-download-button"));
	},

	createFilterForm: function(filters) {
		// generate the form for playing with the data
		this.filterFormElement.html(filterSkeleton);
		filterform.createFormFromFilters(this.filterFormElement, filters, mapper.countryCodeToName);
	},

	filterLoadedCallback: function(csvType, csvData, filters) {
		this.createFilterForm(filters);
	},

	showFilteredCsv: function() {
		this.showNowWorking();
		arrows.clearTooltip();
		mapper.resetZoom();
		var routes = csv.filterDataAndReturnRoutes(
			this.currentCsvType, this.currentCsvData, filterform.filterValues);
		if (!routes) {
			console.log("failed to get routes");
			return;
		}

		var pointRoles = routes.getPointRoles();
		this.currentUnit = csv.getUnit(this.currentCsvType, filterform.filterValues);
		arrows.currentUnit = this.currentUnit;
		// now draw the routes
		if (this.config.arrowType === "plain-arrows") {
			arrows.drawRouteCollectionPlainArrows(routes, pointRoles);
		} else if (this.config.arrowType === "flowmap") {
			arrows.drawRouteCollectionFlowmap(routes, pointRoles);
		} else {
			console.log("unknown config.arrowType: " + this.config.arrowType);
		}
		arrows.drawLegend();
		// colour in the countries that are trading
		mapper.colorTradingCountries(pointRoles);
		this.stopNowWorking();
	},

	filterformChangedCallback: function(columnName) {
		this.showFilteredCsv();
	},

	csvLoadedCallback: function(csvType, csvData) {
		// first cache the current values, so we can regenerate if we want
		this.currentCsvData = csvData;
		this.currentCsvType = csvType;

		document.querySelector("body").classList.add("csv-data-loaded");
		this.showFilteredCsv();
		this.reportCsvLoadErrors();
	},

	reportCsvLoadErrors: function() {
		var errorDetails,
			errorMsgList = csv.loadErrorsToStrings(),
			errorFieldset = d3.select(".csv-load-errors");

		// clear errors
		errorFieldset.classed("haserror", false);

		// return here if no error
		if (errorMsgList.length === 0) { return; }

		errorFieldset.classed("haserror", true);

		errorFieldset.html('<p><strong>Errors:</strong> <span class="showhide">Show</span></p>');
		errorDetails = errorFieldset.append("div")
			.attr("id", "csv-load-error-details")
			.attr("style", "display: none");
		for (var i = 0; i < errorMsgList.length; i++) {
			errorDetails.append("p").text(errorMsgList[i]);
		}

		var moduleThis = this;
		errorFieldset.select(".showhide").on("click", function() { moduleThis.csvLoadErrorShowHide(); });
	},

	csvLoadErrorShowHide: function() {
		var errorDetails = document.getElementById("csv-load-error-details");
		var showHide = document.querySelector(".csv-load-errors > p > span.showhide");
		if (errorDetails.style.display === "block") {
			errorDetails.style.display = "none";
			showHide.textContent = "Show";
		} else {
			errorDetails.style.display = "block";
			showHide.textContent = "Hide";
		}
	},

	csvLoadErrorCallback: function() {
		this.reportCsvLoadErrors();
	}

	};
});
