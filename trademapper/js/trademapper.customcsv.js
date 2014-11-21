define([
	'jquery',
	'util',
	'vendor/bean',
	'vendor/doT',
	"text!../fragments/customcsv.html"
], function(
	$,
	util,
	bean,
	doT,
	tmplCustomCsv
) {

	return {
		formProcessedCallback: null,
		originalFilterSpec: null,

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
				{ text: 'Latitude', value: 'latitude' },
				{ text: 'Longitude', value: 'longitude' }
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

		/*
		 * the 2nd argument can be null, in which case auto detection
		 * will be attempted before displaying the form
		 */
		init: function(rawCsv, filterSpec, callback) {
			// we use parseRows() so we have access to the headers, and
			// maintain the column order
			var rowData = d3.csv.parseRows(rawCsv),
				containerEl = document.createElement('div');
			this.formProcessedCallback = callback;

			if (filterSpec === null) {
				filterSpec = this.autoCreateFilterSpec(rowData);
			} else {
				filterSpec = this.ensureShortNamePresent(filterSpec);
			}
			// deep copy the object
			this.originalFilterSpec = $.extend(true, {}, filterSpec);

			document.body.appendChild(containerEl);
			document.body.classList.add('has-overlay');

			this.createForm(containerEl, rowData, filterSpec);
		},

		createForm: function(containerEl, rowData, filterSpec) {
			var moduleThis = this;
			containerEl.innerHTML = doT.template(tmplCustomCsv)
					(this.createContext(rowData, filterSpec));
			var optionsEl = containerEl.querySelector('.customcsv__options');

			// set the data-type when the column type is changed so that the CSS
			// will show/hide the relevant form elements
			bean.on(optionsEl, 'change', 'select[name="type"]', function(e) {
				e.currentTarget.parentNode.setAttribute('data-type', e.currentTarget.value);
			});

			bean.on(document.querySelector('.customcsv__reset'), 'click', function(e) {
				var newFilterSpec = $.extend(true, {}, moduleThis.originalFilterSpec);
				moduleThis.createForm(containerEl, rowData, newFilterSpec);
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

		createContext: function(rowData, filterSpec) {
			return {
				headers: rowData[0],
				data: rowData.slice(0,5),
				rowcount: rowData.length - 1,  // don't count the header row
				filterSpec: filterSpec,
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
			val = val.trim();
			if (val.length === 0) {
				return 'ignore';
			}

			var asInt = parseInt(val, 10);
			if (!isNaN(asInt) && asInt > 1900 && asInt < 2100) {
				return 'year';
			}
			else if (!isNaN(parseFloat(val, 10))) {
				return 'quantity';
			} else if (val.match(/^[A-Z]{2}$/)) {
				return 'location';
			} else {
				return 'text';
			}
		},

		headerNameToLocationRole: function(headerName, cautious) {
			var mapping = [
				// try fairly explicit mappings first
				['export', 'exporter'],
				['import', 'importer'],
				['destination', 'importer'],
				['origin', 'origin'],
				['transit', 'transit']
			];

			if (!cautious) {
				mapping = mapping.concat([
					// only try abbreviations after the more explicit
					['exp', 'exporter'],
					['imp', 'importer'],
					['dest', 'importer'],
					['dst', 'importer'],
					['org', 'origin'],
					['tra', 'transit'],
				]);
			}
			var lowHeader = headerName.toLowerCase();
			for (var i = 0; i < mapping.length; i++) {
				if (lowHeader.indexOf(mapping[i][0]) > -1) {
					return mapping[i][1];
				}
			}
			return '';
		},

		/*
		 * create a filter spec based on the CSV row data
		 */
		autoCreateFilterSpec: function(rowData) {
			var colType, role, header,
				rowsToTry = Math.min(6, rowData.length),
				roleToOrder = {
					origin: 1,
					exporter: 2,
					transit: 3,
					importer: 4,
					'': 5  // the unknown value
				},
				filterSpec = {},
				headers = rowData[0];

			for (var i = 0; i < headers.length; i++) {
				header = headers[i];
				// try to find column type in first few columns
				colType = 'ignore';
				for (var j = 1; j < rowsToTry; j++) {
					colType = this.detectColumnType(rowData[j][i]);
					if (colType !== 'ignore') {
						break;
					}
				}
				if (colType !== 'location') {
					role = this.headerNameToLocationRole(header, true);
					if (role !== '') {
						if (header.toLowerCase().indexOf('long') > -1 ||
								header.toLowerCase().indexOf('lat') > -1) {
							colType = 'location_extra';
						} else {
							colType = 'location';
						}
					}
				}

				filterSpec[header] = {
					type: colType,
					shortName: header
				};
				if (colType === 'location') {
					role = this.headerNameToLocationRole(header, false);
					filterSpec[header].locationType = 'country_code';
					filterSpec[header].locationRole = role;
					filterSpec[header].locationOrder = roleToOrder[role];
					filterSpec[header].multiSelect = true;
				} else if (colType === 'location_extra') {
					role = this.headerNameToLocationRole(header, false);
					if (header.toLowerCase().indexOf('long') > -1) {
						filterSpec[header].locationExtraType = 'longitude';
					} else {
						filterSpec[header].locationExtraType = 'latitude';
					}
					filterSpec[header].locationOrder = roleToOrder[role];
				} else if (colType === 'text') {
					if (header.toLowerCase().indexOf('unit') > -1) {
						filterSpec[header].isUnit = true;
						filterSpec[header].multiSelect = false;
					} else {
						filterSpec[header].isUnit = false;
						filterSpec[header].multiSelect = true;
					}
				} else if (colType === 'text_list') {
					filterSpec[header].multiSelect = true;
				}
			}
			return filterSpec;
		},

		ensureShortNamePresent: function(filterSpec) {
			Object.keys(filterSpec).forEach(function(key) {
				if (!filterSpec[key].hasOwnProperty('shortName')) {
					filterSpec[key].shortName = key;
				}
			});
			return filterSpec;
		},

		processImportForm: function(containerEl, e) {
			var moduleThis = this,
				filterSpec = {};
			Array.prototype.forEach.call(document.querySelectorAll('.customcsv__form-container'), function(el) {
				var headerName = el.getAttribute('data-header'),
					formValueToSpec = function(name, formType) {
						moduleThis.formValueToSpecValue(filterSpec, headerName, el, name, formType);
					};

				filterSpec[headerName] = {};
				formValueToSpec('type', 'select');

				if (filterSpec[headerName].type === 'location') {
					formValueToSpec('locationType', 'select');
					formValueToSpec('locationRole', 'select');
					formValueToSpec('locationOrder', 'textInt');
					formValueToSpec('multiSelect', 'checkbox');
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
			// the shortName is in the header
			Array.prototype.forEach.call(document.querySelectorAll('.customcsv__header-form-container'), function(el) {
				var headerName = el.getAttribute('data-header'),
					formValueToSpec = function(name, formType) {
						moduleThis.formValueToSpecValue(filterSpec, headerName, el, name, formType);
					};
				formValueToSpec('shortName', 'text');
			});

			var errors = this.validateFilterSpec(filterSpec);
			if (errors) {
				// TODO: form validation here.  If fail, reshow form with errors
			}

			document.body.classList.remove('has-overlay');
			document.body.removeChild(containerEl);

			console.log(filterSpec);
			this.formProcessedCallback(filterSpec);
		},

		formValueToSpecValue: function(filterSpec, headerName, el, name, formType) {
			var input, value;
			if (formType === 'select') {
				input = el.querySelector('select[name=' + name + ']');
			} else {
				input = el.querySelector('input[name=' + name + ']');
			}
			if (formType === 'checkbox') {
				value = input.checked;
			} else if (formType === 'textInt') {
				value = parseInt(input.value);
			} else {
				value = input.value;
			}

			filterSpec[headerName][name] = value;
		},

		validateFilterSpec: function(filterSpec) {
			var errors = {},
				generalErrors = this.validateFilterSpecGeneral(filterSpec),
				columnErrors = this.validateFilterSpecColumns(filterSpec);

			if (generalErrors.length > 0) {
				errors.general = generalErrors;
			}
			if (Object.keys(columnErrors).length > 0) {
				errors.column = columnErrors;
			}

			return errors;
		},

		validateFilterSpecGeneral: function(filterSpec) {
			// - general errors
			//   - 1+ quantity
			//   - 2+ locations
			//   - location order - no duplicates, integers
			//   - lat long properly done
			var errors = [],
				quantityCount = this.countColumnsOfType(filterSpec, 'quantity'),
				locationCount = this.countColumnsOfType(filterSpec, 'location');

			if (quantityCount === 0) {
				errors.push("There need to be at least 1 quantity column.");
			}
			if (locationCount < 2) {
				errors.push("There need to be at least 2 location columns.");
			}

			errors.concat(this.checkLocationOrdering(filterSpec));

			// TODO: latlong check
			//
			// TODO: generate list of columns that relate to errors?

			return errors;
		},

		countColumnsOfType: function(filterSpec, type) {
			return this.getColumnsOfType(filterSpec, type).length;
		},

		getColumnsOfType: function(filterSpec, type) {
			var columns = [];
			Object.keys(filterSpec).forEach(function(key) {
				if (filterSpec[key].type === type) {
					columns.push(filterSpec[key]);
				}
			});
			return columns;
		},

		checkLocationOrdering: function(filterSpec) {
			// check there are no duplicate orders
			var errors = [],
				counts = {},
				columns = {};
			Object.keys(filterSpec).forEach(function(key) {
				if (filterSpec[key].type === 'location') {
					var order = filterSpec[key].locationOrder;
					if (counts[order]) {
						counts[order] = counts[order] + 1;
						columns[order].push(key);
					} else {
						counts[order] = 1;
						columns[order] = [key];
					}
				}
			});

			Object.keys(counts).forEach(function(key) {
				if (counts[key] > 1) {
					errors.push("More than one location column has the order: " +
					            key + "(columns are: " +
					            columns[key].join(', ') + ").");
				}
			});
			return errors;
		},

		// TODO: extend to full check (required fields, types of values) -
		//       currently we assume this came from processImportForm() which
		//       is constrained to only produce certain errors.  But we might
		//       want to extend later.
		validateFilterSpecColumns: function(filterSpec) {
			// - column specific errors
			//   - multiselect and isUnit are incompatible
			var columnErrorCollection = {};
			Object.keys(filterSpec).forEach(function(key) {
				var columnSpec = filterSpec[key],
					columnErrors = [];

				if (columnSpec.multiSelect && columnSpec.isUnit) {
					columnErrors.push("Cannot select both multiSelect and isUnit.");
				}

				if (columnSpec.type === 'location' ||
					columnSpec.type === 'location_extra') {
					if (!util.isInt(columnSpec.locationOrder)) {
						columnErrors.push("Invalid value for locationOrder: " +
						                  columnSpec.locationOrder);
					}
				}

				if (columnErrors.length > 0) {
					columnErrorCollection[key] = columnErrors;
				}
			});
			return columnErrorCollection;
		}

	};
});
