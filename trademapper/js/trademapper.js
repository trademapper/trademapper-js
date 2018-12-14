/*
 * The main trademapper library
 *
 * trademapper.js is the main file - it loads and configures the other
 * trademapper files, including setting callbacks.
 *
 * INITIALISATION
 *
 * It is set up by calling the `init()` function which takes the following
 * arguments:
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
 * The init function:
 *
 * - caches the URL parameters and dom elements
 * - creates the form to load the CSV, the SVG element for the map, the slider
 *   and the tooltip
 * - calls init for mapper, arrows and csv, and pokes callbacks into route
 *   and filterform
 * - sets up the toggle for the sidebar and the year slider
 * - finally, if there is a URL parameter, it loads a CSV file from that URL
 *
 * CONTROL FLOW
 *
 * There is a listener on the form element to load a CSV.  When that form is
 * filled in, the csv module:
 *
 * - loads the csv using d3
 * - finds the csv type (and hence filterSpec) and from them it constructs the
 *   filters object
 * - calls filterLoadedCallback() with the csvData and the filters object -
 *   this is used to initialise the filterform, which then maintains its own
 *   filterValues object based on the filters object and the values set in the
 *   form by the user.
 * - calls csvLoadedCallback().  That caches the csvData and then calls
 *   showFilteredCsv() to actually display the data - see below.
 *
 * The filterform listens for any change on the constituent parts of its form.  On
 * any change it will update its filterValues and then call filterformChangedCallback()
 * which again calls showFilteredCsv()
 *
 * The slider also listens for any change to its value.  It will then make a copy
 * of the filterform values, update the year range, and of course call showFilteredCsv()
 *
 * showFilteredCsv() is the heart of displaying and re-displaying the data.  It calls
 * the csv module to convert the csv data into an aggregated RouteCollection based
 * on filterform.filterValues.  The arrows module is then used to draw the
 * RouteCollection and the legend.  Finally mapper is used to colour in the
 * countries involved in the trade.
 *
 * DATA STRUCTURES
 *
 * So the key data structures are:
 *
 * - filterSpec - a specification for the filters for a type of CSV.  It is
 *   used, along with the data from a CSV file to generate the filters.  See
 *   trademapper.csv.definition.js for some filterSpec examples.
 * - filters - a specification based on the filterSpec and the actual
 *   values found in a particular CSV.  It is used to generated the various
 *   filters in the UI.  Search for returnedFilters in tests/js/test-csv.js
 *   to see an example of the filters data structure.
 * - filterValues - the current values of the filters specified in the UI
 *
 * All these have the CSV column name as the main key, and they vary in what
 * they store for each column name.
 */
define([
	"jquery",
	"d3",
	"trademapper.analytics",
	"trademapper.arrows",
	"trademapper.csv",
	"trademapper.filterform",
	"trademapper.mapper",
	"trademapper.route",
	"trademapper.yearslider",
	"trademapper.imageexport",
	"trademapper.videoexport",
	"trademapper.progress",
	"trademapper.spinner",
	"trademapper.layerloader",
	"util",
	"config",
	"text!../fragments/filterskeleton.html",
	"text!../fragments/csvformskeleton.html",
	"text!../fragments/yearsliderskeleton.html",
	"text!../fragments/reopencustomcsv.html",
],
function($, d3, analytics, arrows, csv, filterform, mapper, route, yearslider,
			imageExport, videoExport, Progress, Spinner, layerLoader, util, config,
			filterSkeleton,	csvFormSkeleton, yearSliderSkeleton, reopenCustomCsv) {
	"use strict";

	return {
	config: null,
	mapRootElement: null,
	fileFormElement: null,
	filterFormElement: null,
	toolbarElement: null,
	tooltipElement: null,
	fileInputElement: null,
	imageExportButtonElement: null,
	changeOverTimeElement: null,
	tmsvg: null,
	svgDefs: null,
	zoomg: null,
	controlg: null,
	currentCsvData: null,
	currentCsvFirstTenRows: null,
	currentFilterSpec: null,
	maxSingleYearQuantity: 1,
	minMaxYear: [0, 0],
	currentUnit: null,
	queryString: null,
	yearColumnName: null,
	yearSlider: null,
	imageExport: null,

	defaultConfig: config,

	init: function(mapId, fileFormElementId, layerFormElementId, filterFormElementId,
								 svgExportButtonElementId, pngExportButtonElementId,
								 videoExportButtonElementId, changeOverTimeElementId, tmConfig) {
		this.queryString = util.queryString();
		this.mapRootElement = d3.select(mapId);
		this.fileFormElement = d3.select(fileFormElementId);
		this.filterFormElement = d3.select(filterFormElementId);
		this.svgExportButtonElement = d3.select(svgExportButtonElementId);
		this.pngExportButtonElement = d3.select(pngExportButtonElementId);
		this.videoExportButtonElement = d3.select(videoExportButtonElementId);
		this.changeOverTimeElement = d3.select(changeOverTimeElementId);
		this.setConfigDefaults(tmConfig);

		this.createCsvOnlyForm();

		this.tmsvg = this.mapRootElement.insert("svg")
			.attr("id", "mapcanvas")
			.attr("class", "map-svg flow")
			.attr("viewBox", "0 0 "+this.config.width+" "+this.config.height);

		this.svgDefs = this.tmsvg.append("defs");
		this.zoomg = this.tmsvg.append("g").attr("class", "zoomgroup");
		// append a background rectangle so mouse scroll zoom works over sea
		this.zoomg.append("rect")
			.attr("width", "150%")
			.attr("height", "150%")
			.attr("y", "-150")
			.attr("class", "mapocean");
		this.controlg = this.tmsvg.append("g").attr("class", "controlgroup");

		this.changeOverTimeElement.html(yearSliderSkeleton);
		this.tooltipElement = this.mapRootElement.append("div")
			.attr("id", "maptooltip");

		// need to init mapper before arrows otherwise the map is on top of
		// the arrows
		mapper.init(this.zoomg, this.controlg, this.svgDefs, this.config, this.tmsvg);
		arrows.init(this.tmsvg, this.zoomg, this.svgDefs, '#maptooltip', this.config.arrowColours,
			this.config.minArrowWidth, this.config.maxArrowWidth, this.config.pointTypeSize,
			mapper.countryCodeToInfo);

		// set up the various callbacks we need to link things together
		var moduleThis = this;
		csv.init(
			this.csvLoadedCallback.bind(this),
			function(csvData, filterSpec, filters) { moduleThis.filterLoadedCallback(csvData, filterSpec, filters); },
			function() { moduleThis.csvLoadErrorCallback(); },
			this.config.skipCsvAutoDetect);

		imageExport.init(this.svgExportButtonElement, this.pngExportButtonElement,
			this.tmsvg.node(), this);
		this.imageExport = imageExport;

		videoExport.init(this.videoExportButtonElement, this);
		// the video export button is enabled after the CSV loads
		this.setVideoExportButtonActive(false);

		// bind events on the video exporter to a progress modal instance
		this.createVideoProgressModal(videoExport);

		// for loading topojson layers
		layerLoader.init(layerFormElementId);
		this.createLayerLoadingModal(layerLoader, mapper);

		route.setCountryGetPointFunc(function(countryCode) {return mapper.countryCentrePoint(countryCode);});
		route.setPortGetPointFunc(function(portCode) {return mapper.portCentrePoint(portCode);});
		route.setLatLongToPointFunc(function(latLong) {return mapper.latLongToPoint(latLong);});
		filterform.formChangedCallback = function(columnName) {return moduleThis.filterformChangedCallback(columnName); };
		yearslider.showTradeForYear = function(year) {return moduleThis.showTradeForYear(year); };
		// slightly misnamed as we go back to the filter values for the years
		yearslider.showTradeForAllYears = function() {return moduleThis.filterformChangedCallback(); };
		yearslider.enableDisableCallback = function(enable) {return moduleThis.yearSliderEnableDisableCallback(enable); };

		this.setUpAsideToggle();
		yearslider.create();

		this.yearslider = yearslider;

		if (this.queryString.hasOwnProperty("loadcsv")) {
			this.loadCsvFromUrl();
		}

		// Ensure we react to window resizes when needed
		$(window).resize(this.updateLayout.bind(this));
		this.updateLayout();

		// When all else is ready, set up analytics
		analytics.init();
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

		if (this.queryString.hasOwnProperty("skipCsvAutoDetect")) {
			this.config.skipCsvAutoDetect = true;
		}

		// work out some stuff from the size of the element we're attached to
		if (!this.config.hasOwnProperty("width")) {
			this.config.width = parseInt(this.mapRootElement.style('width'));
		}
		if (!this.config.hasOwnProperty("height")) {
			this.config.height = this.config.width * this.config.ratio;
				//	this.config.height = parseInt(this.mapRootElement.style('height'));
		}
	},

	setUpAsideToggle: function() {
		// TODO: make the document element id configurable
		var filterToggle = document.getElementById('info-panel-toggle'),
			filterPanel = document.getElementById('info-panel');

		filterToggle.onclick = function() {
			filterPanel.classList.toggle('toggled');
			if (filterPanel.classList.contains('toggled')) {
				filterToggle.textContent = "Show";
			} else {
				filterToggle.textContent = "Hide";
			}
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
		// stop the form "submitting" and causing page reload
		$('form#tm-file-select').submit(function() { return false; });
		this.fileInputElement = this.fileFormElement.select('input[type="file"]');
		csv.setFileInputElement(this.fileInputElement);
		csv.setUrlInputElement(this.fileFormElement.select("#urlinput"),
							this.fileFormElement.select("#url-download-button"));
	},

	addChangeFilterSpecToDataTab: function() {
		var dataFilterSpecChange = d3.select(".change-filter-spec");
		this.addChangeFilterSpecLink(dataFilterSpecChange);
	},

	createFilterForm: function(filters) {
		// generate the form for playing with the data
		this.filterFormElement.html(filterSkeleton);
		filterform.createFormFromFilters(this.filterFormElement, filters, mapper.countryCodeToName);
		var elFilterSpecChange = this.filterFormElement.append('div');
		this.addChangeFilterSpecLink(elFilterSpecChange);
		// finally ensure the tab is now available
		document.querySelector('li[role=filters]').style.display = "block";
        document.querySelector('li[role=export]').style.display = "block";
	},

	createVideoProgressModal: function (videoExport) {
		var videoProgress = Progress(document.body);
		videoExport.on('start', function () {
			videoProgress.setProgress(0);
			videoProgress.show();
		});
		videoExport.on('progress', function (event, progress) {
			videoProgress.setProgress(progress);
		});
		videoExport.on('end', videoProgress.hide.bind(videoProgress));
	},

	createLayerLoadingModal: function (layerLoader, mapper) {
		var layerSpinner = Spinner(document.body);

		layerLoader.on("start", function (event, filesize) {
			if (filesize > 1000000) {
				var msg = "WARNING: layer files > 1Mb in size are likely to cause " +
					"performance issues";
				layerSpinner.setMessage(msg);
			}
			layerSpinner.show();
		});

		layerLoader.on("error", function () {
			layerSpinner.hide();
		});

		layerLoader.on("layer", function (event, layer) {
			// the mapper knows when the topojson has been drawn, so allow that to
			// control when the spinner is hidden
			// TODO don't pass callbacks around, use events consistently throughout
			try {
				mapper.loadTopoJSON(layer, function () {
					layerSpinner.hide();
					layerLoader.layerReady(layer);

					// we copy the layers list here, otherwise we can't detect changes
					// to the number of layers
					var layers = [];
					for (var i = 0; i < layerLoader.layers.length; i++) {
						layers.push(util.deepCopy(layerLoader.layers[i]));
					}
					arrows.drawLegend({layers: layers});
				});
			} catch (e) {
				console.error(e);

				// very unlikely to reach this, as any valid JSON is handled correctly
				// by d3's topojson loader, even if it doesn't contain any
				// geometry data at all
				layerSpinner.hide();
				layerLoader.showError("Error rendering topojson; check your file.");
				layerLoader.setIsLoading(false);
			}
		});
	},

	addChangeFilterSpecLink: function(elFilterSpecChange) {
		elFilterSpecChange.html(reopenCustomCsv);

		var filterSpecChange = function() {
			csv.editFilterSpec(this.currentCsvData, this.currentCsvFirstTenRows, this.currentFilterSpec);
		}.bind(this);
		elFilterSpecChange.on("click", filterSpecChange);
	},

	filterLoadedCallback: function(csvData, filterSpec, filters) {
		var yearColumns = filterform.getFilterNamesForType(filters, ["year"]);
		if (yearColumns.length === 1) {
			this.yearColumnName = yearColumns[0];
		}
		this.minMaxYear = csv.getMinMaxYear(filters);
		if (this.minMaxYear[0] === 0 && this.minMaxYear[1] === 0) {
			yearslider.enable("No Year Column");
		} else if (this.minMaxYear[0] === this.minMaxYear[1]) {
			yearslider.disable("There is only data for one year");
		} else {
			yearslider.enable(this.minMaxYear[0], this.minMaxYear[1]);
		}
		this.createFilterForm(filters);
	},
	updateMapperZoom: function() {
		var routes = csv.filterDataAndReturnRoutes(this.currentCsvData, this.currentFilterSpec, filterform.filterValues);
		mapper.zoomToShow(routes.getPointRoles());
	},
			/*
	 * the maxQuantity is optional and so can be null
	 */
	showFilteredCsv: function(filterValues, maxQuantity) {
		this.showNowWorking();
		arrows.clearTooltip();

		var routes= csv.filterDataAndReturnRoutes(this.currentCsvData, this.currentFilterSpec, filterValues);
		if (!routes) {
			console.log("failed to get routes");
			return;
		}

		var pointRoles = routes.getPointRoles();
		this.currentUnit = csv.getUnit(this.currentFilterSpec, filterValues);
		this.drawArrows(routes,pointRoles, maxQuantity);

		// colour in the countries that are trading and/or countries containing a port
		// which is trading
		mapper.setTradingCountries(routes.getCountryCodes());
		this.stopNowWorking();
	},

	drawArrows: function(routes, pointRoles, maxQuantity) {
			arrows.currentUnit = this.currentUnit;
			// now draw the routes
			if (this.config.arrowType === "plain-arrows") {
					arrows.drawRouteCollectionPlainArrows(routes, pointRoles, maxQuantity);
			} else if (this.config.arrowType === "flowmap") {
					arrows.drawRouteCollectionFlowmap(routes, pointRoles, maxQuantity);
			} else {
					console.log("unknown config.arrowType: " + this.config.arrowType);
			}

			// check which roles are actually used in routes and only draw nodes
			// in the legend for those roles
			arrows.drawLegend({locationRoles: routes.getUniqueRoles()});
	},

	yearSliderEnableDisableCallback: function(enable) {
		if (enable) {
			this.updateMaxSingleYearQuantity();
		}
		filterform.setYearRangeStatus(!enable);
	},

	showTradeForYear: function(year) {
		// guard against the value not being set
		if (!year || !this.yearColumnName) { return; }
		// this does a deep clone of the object
		var filterValues = util.deepCopy(filterform.filterValues);
		// now we set the year to this year
		filterValues[this.yearColumnName].minValue = year;
		filterValues[this.yearColumnName].maxValue = year;
		this.showFilteredCsv(filterValues, this.maxSingleYearQuantity);
	},

	filterformChangedCallback: function(columnName) {
		this.updateMapperZoom();
		if (yearslider.sliderEnabled) {
			this.updateMaxSingleYearQuantity();
			this.showTradeForYear(yearslider.currentYear);
		} else {
			this.showFilteredCsv(filterform.filterValues);
		}
	},

	updateMaxSingleYearQuantity: function() {
		if (this.yearColumnName && this.minMaxYear[0] !== 0 && this.minMaxYear[1] !== 0) {
			this.maxSingleYearQuantity = csv.calcMaxSingleYearQuantity(
				this.currentCsvData, this.currentFilterSpec, filterform.filterValues,
				this.config.arrowType,
				this.yearColumnName, this.minMaxYear[0], this.minMaxYear[1]);
		}
	},

	csvLoadedCallback: function(csvFileName, csvData, csvFirstTenRows, filterSpec) {
		// first cache the current values, so we can regenerate if we want
		this.currentCsvData = csvData;
		this.currentCsvFirstTenRows = csvFirstTenRows;
		this.currentFilterSpec = filterSpec;

		// update file name
		this.fileFormElement.select('.custom-fileinput-filename').text(csvFileName);

		document.querySelector("body").classList.add("csv-data-loaded");
		this.updateMapperZoom();
		this.updateMaxSingleYearQuantity();
		this.showFilteredCsv(filterform.filterValues);
		this.addChangeFilterSpecToDataTab();
		this.setVideoExportButtonActive(filterSpec);
		var errorsShown = this.reportCsvLoadErrors();
		if (!errorsShown) {
			// switch to filters tab
			$('#panel-tabs a[href="#filters"]').tab('show');
		}
	},

	setVideoExportButtonActive: function(filterSpec) {
		// if the filter spec has at least one year column,
		// enable the video export button; note that if the year column is empty
		// for all rows, the video export will be available but may break
		var on = false;

		if (filterSpec !== false) {
			for (var columnName in filterSpec) {
				if (filterSpec[columnName].type === "year") {
					on = true;
					break;
				}
			}
		}

		if (on) {
			this.videoExportButtonElement.attr("disabled", null);
		}	else {
			this.videoExportButtonElement.attr("disabled", "disabled");
		}
	},

	/*
	 * returns true if errors shown
	 */
	reportCsvLoadErrors: function() {
		var errorDetails,
			errorMsgList = csv.loadErrorsToStrings(),
			errorFieldset = d3.select(".csv-load-errors");

		// clear errors
		errorFieldset.classed("haserror", false);

		// return here if no error
		if (errorMsgList.length === 0) {
			errorFieldset.html('');
			return false;
		}

		errorFieldset.classed("haserror", true);

		errorFieldset.html('<p><strong>Errors:</strong></p>');
		errorDetails = errorFieldset.append("div")
			.attr("id", "csv-load-error-details");
		for (var i = 0; i < errorMsgList.length; i++) {
			errorDetails.append("p").text(errorMsgList[i]);
		}
		return true;
	},

	csvLoadErrorCallback: function() {
		return this.reportCsvLoadErrors();
	},


	/**
	 * Adjust layout when needed
	 */
	updateLayout: function() {
		// Resize the active pane
		var $activePane = $('#tabs .tab-pane.active');
		$activePane.css('max-height', $(window).height() - $activePane.offset().top);
	}

	};
});
