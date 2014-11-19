define([
	'vendor/bean',
	'vendor/doT',
	"text!../fragments/customcsv.html"
], function(
	bean,
	doT,
	tmplCustomCsv
) {

	var typeSelectConfig = {
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
	locationTypeSelectConfig = {
		type: 'locationType',
		options: [
			{ text: 'Country Code', value: 'country_code' },
			{ text: 'Country Code List', value: 'country_code_list' },
			{ text: 'Latitude/Longitude Name', value: 'latLongName' }
		]
	},
	locationExtraTypeSelectConfig = {
		type: 'locationExtraType',
		options: [
			{ text: 'Latitude', value: 'longitude' },
			{ text: 'Longitude', value: 'latitude' }
		]
	},
	locationRoleSelectConfig = {
		type: 'locationRole',
		options: [
			{ text: 'Exporter', value: 'exporter' },
			{ text: 'Importer', value: 'importer' },
			{ text: 'Origin',   value: 'origin' },
			{ text: 'Transit',  value: 'transit' }
		]
	},
	locationOrderTextConfig = {
		type: 'locationOrder',
		label: 'Location Order',
		maxlength: 3,
		title: 'A number to allow ordering of the locations'
	},
	shortNameTextConfig = {
		type: 'shortName',
		label: 'Alt Name',
		title: 'An optional name to display instead of the column header'
	},
	isUnitCheckboxConfig = {
		type: 'isUnit',
		label: 'Is "units" column',
		title: 'Whether this column is the units (only one column can have that value).'
	},
	multiSelectCheckboxConfig = {
		type: 'multiSelect',
		label: 'multi-select',
		title: 'Can multiple options be selected in the filters.'
	},
	// TODO:
	// - all: shortName
	// - text: multiSelect - true/false
	// - text: isUnit - true/false
	// - text: verboseNames !!!
	// - location: order
	// - location: latLong stuff !

	detectColumnType = function(val) {
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
	};

	return {
		init: function(rawCsv, callback) {
			// use d3 csv parsing
			var rowData = d3.csv.parseRows(rawCsv),
				headers = rowData[0],
				firstRow = rowData[1],
				containerEl = document.createElement('div'),
				ctx = {
					headers:headers,
					data: rowData.slice(0,5),
					rowcount: rowData.length,
					selects: [
						typeSelectConfig,
						locationTypeSelectConfig,
						locationExtraTypeSelectConfig,
						locationRoleSelectConfig
					],
					globalTexts: [
						shortNameTextConfig
					],
					otherTexts: [
						locationOrderTextConfig
					],
					checkboxes: [
						isUnitCheckboxConfig,
						multiSelectCheckboxConfig
					],
				};

			containerEl.innerHTML = doT.template(tmplCustomCsv)(ctx);
			document.body.appendChild(containerEl);
			document.body.classList.add('has-overlay');

			var optionsEl = containerEl.querySelector('.customcsv__options');

			bean.on(optionsEl, 'change', 'select[name="type"]', function(e) {
				e.currentTarget.parentNode.setAttribute('data-type', e.currentTarget.value);
			});

			// basic auto detection
			Array.prototype.forEach.call(optionsEl.querySelectorAll('.customcsv__select--type'), function(el, i){
				el.value = detectColumnType(firstRow[i]);
				bean.fire(el, 'change');
			});

			bean.on(document.querySelector('.customcsv__done'), 'click', function(e) {
				var filterSpec = {};
				Array.prototype.forEach.call(document.querySelectorAll('.customcsv__form-container'), function(el, i) {
					var headerName = el.getAttribute('data-header'),
						colType = el.querySelector('select[name=type]').value,
						shortName = el.querySelector('input[name=shortName]').value;
					filterSpec[headerName] = {
						type: colType
					};
					if (shortName) { filterSpec[headerName].shortName = shortName; }

					if (colType === 'location') {
						filterSpec[headerName].locationType = el.querySelector('select[name=locationType]').value;
						filterSpec[headerName].locationRole = el.querySelector('select[name=locationRole]').value;
						/*var order = {  // TODO: not sure how best to handle this atm
							'origin': 1,
							'exporter': 2,
							'transit': 3,
							'importer': 4
						};
						filterSpec[headerName].locationOrder = order[filterSpec[headerName].locationRole];*/
						filterSpec[headerName].locationOrder = el.querySelector('input[name=locationOrder]').value;
					} else if (colType === 'location_extra') {
						filterSpec[headerName].locationExtraType = el.querySelector('select[name=locationExtraType]').value;
						filterSpec[headerName].locationOrder = el.querySelector('input[name=locationOrder]').value;
					} else if (colType === 'text') {
						filterSpec[headerName].multiSelect = el.querySelector('input[name=multiSelect]').value;
						filterSpec[headerName].isUnit = el.querySelector('input[name=isUnit]').value;
					} else if (colType === 'text_list') {
						filterSpec[headerName].multiSelect = el.querySelector('input[name=multiSelect]').value;
					}
				});

				document.body.classList.remove('has-overlay');
				document.body.removeChild(containerEl);

				console.log(filterSpec);
				callback(filterSpec);

			});

		}
	};
});
