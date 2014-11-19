define([
	'vendor/bean',
	'vendor/doT',
	"text!../fragments/customcsv.html"
], function(
	bean,
	doT,
	tmplCustomCsv
) {

	return {
		formProcessedCallback: null,

		typeSelectConfig: {
			type: 'type',
			options: [
				{ text: 'Ignore',   value: 'ignore' },
				{ text: 'Location', value: 'location'},
				{ text: 'Location (extra info)', value: 'location_extra'},
				{ text: 'Quantity', value: 'quantity' },
				{ text: 'Text',     value: 'text' },
				{ text: 'Text List', value: 'text_list' },
				{ text: 'Year',     value: 'year' }
			]
		},
		locationTypeSelectConfig: {
			type: 'locationType',
			options: [
				{ text: 'Country Code', value: 'country_code' },
				{ text: 'Country Code List', value: 'country_code_list' },
				{ text: 'Latitude/Longitude Name', value: 'latLongName' }
			]
		},
		locationExtraTypeSelectConfig: {
			type: 'locationExtraType',
			options: [
				{ text: 'Latitude', value: 'longitude' },
				{ text: 'Longitude', value: 'latitude' }
			]
		},
		locationRoleSelectConfig: {
			type: 'locationRole',
			options: [
				{ text: 'Exporter', value: 'exporter' },
				{ text: 'Importer', value: 'importer' },
				{ text: 'Origin',   value: 'origin' },
				{ text: 'Transit',  value: 'transit' }
			]
		},
		locationOrderTextConfig: {
			type: 'locationOrder',
			label: 'Location Order',
			maxlength: 3,
			title: 'A number to allow ordering of the locations'
		},
		shortNameTextConfig: {
			type: 'shortName',
			label: 'Alt Name',
			title: 'An optional name to display instead of the column header'
		},
		isUnitCheckboxConfig: {
			type: 'isUnit',
			label: 'Is "units" column',
			title: 'Whether this column is the units (only one column can have that value).'
		},
		multiSelectCheckboxConfig: {
			type: 'multiSelect',
			label: 'multi-select',
			title: 'Can multiple options be selected in the filters.'
		},
		// TODO:
		// - text: verboseNames !!!

		init: function(rawCsv, callback) {
			var moduleThis = this,
				// we use parseRows() so we have access to the headers, and
				// maintain the column order
				rowData = d3.csv.parseRows(rawCsv),
				containerEl = document.createElement('div');
			this.formProcessedCallback = callback;

			containerEl.innerHTML = doT.template(tmplCustomCsv)(this.createContext(rowData));
			document.body.appendChild(containerEl);
			document.body.classList.add('has-overlay');

			var optionsEl = containerEl.querySelector('.customcsv__options');

			// set the data-type so the CSS will show/hide the relevant form elements
			bean.on(optionsEl, 'change', 'select[name="type"]', function(e) {
				e.currentTarget.parentNode.setAttribute('data-type', e.currentTarget.value);
			});

			// basic auto detection
			Array.prototype.forEach.call(optionsEl.querySelectorAll('.customcsv__select--type'), function(el, i){
				var firstRow = rowData[1];
				el.value = moduleThis.detectColumnType(firstRow[i]);
				bean.fire(el, 'change');
			});

			bean.on(document.querySelector('.customcsv__cancel'), 'click', function(e) {
				document.body.classList.remove('has-overlay');
				document.body.removeChild(containerEl);
			});
			var processFormFunc = function(e) {
				this.processImportForm(containerEl, e);
			}.bind(this);
			bean.on(document.querySelector('.customcsv__done'), 'click', processFormFunc);
		},

		createContext: function(rowData) {
			return {
				headers: rowData[0],
				data: rowData.slice(0,5),
				rowcount: rowData.length,
				selects: [
					this.typeSelectConfig,
					this.locationTypeSelectConfig,
					this.locationExtraTypeSelectConfig,
					this.locationRoleSelectConfig
				],
				globalTexts: [
					this.shortNameTextConfig
				],
				otherTexts: [
					this.locationOrderTextConfig
				],
				checkboxes: [
					this.isUnitCheckboxConfig,
					this.multiSelectCheckboxConfig
				],
			};
		},

		detectColumnType: function(val) {
			var asInt = parseInt(val, 10);
			if (!isNaN(asInt) && asInt > 1900 && asInt < 2100) {
				return 'year';
			}
			else if (!isNaN(parseFloat(val, 10))) {
				return 'quantity';
			} else if (val.match(/^[A-Z]{2}$/)) {
				return 'location';
			} else {
				return 'ignore';
			}
		},

		processImportForm: function(containerEl, e) {
			var moduleThis = this,
				filterSpec = {};
			Array.prototype.forEach.call(document.querySelectorAll('.customcsv__form-container'), function(el, i) {
				var headerName = el.getAttribute('data-header'),
					formValueToSpec = function(name, formType) {
						moduleThis.formValueToSpecValue(filterSpec, headerName, el, name, formType);
					};

				filterSpec[headerName] = {};
				formValueToSpec('type', 'select');
				formValueToSpec('shortName', 'text');

				if (filterSpec[headerName].type === 'location') {
					formValueToSpec('locationType', 'select');
					formValueToSpec('locationRole', 'select');
					formValueToSpec('locationOrder', 'textInt');
				} else if (filterSpec[headerName].type === 'location_extra') {
					formValueToSpec('locationExtraType', 'select');
					formValueToSpec('locationOrder', 'textInt');
				} else if (filterSpec[headerName].type === 'text') {
					formValueToSpec('multiSelect', 'checkbox');
					formValueToSpec('isUnit', 'checkbox');
				} else if (filterSpec[headerName].type === 'text_list') {
					formValueToSpec('multiSelect', 'checkbox');
				}
			});

			document.body.classList.remove('has-overlay');
			document.body.removeChild(containerEl);

			console.log(filterSpec);
			this.formProcessedCallback(filterSpec);
		},

		formValueToSpecValue: function(filterSpec, headerName, el, name, formType) {
			var value;
			if (formType === 'select') {
				value = el.querySelector('select[name=' + name + ']').value;
			} else {
				value = el.querySelector('input[name=' + name + ']').value;
			}
			if (formType === 'checkbox') {
				value = (value === "on");  // convert to bool
			} else if (formType === 'textInt') {
				value = parseInt(value);
			}

			filterSpec[headerName][name] = value;
		}

	};
});
