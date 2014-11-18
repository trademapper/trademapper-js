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
			{ text: 'Quantity', value: 'quantity' },
			{ text: 'Text',     value: 'text' },
			{ text: 'Year',     value: 'year' }
		]
	},
	locationTypeSelectConfig = {
		type: 'locationType',
		options: [
			{ text: 'Country Code', value: 'country_code' }
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
	// TODO:
	// - all: shortName
	// - text: multiselect - true/false
	// - text: isUnit - true/false
	// - text: verboseNames !!!
	// - location: order
	// - location: country_code_list
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
						locationRoleSelectConfig
					]
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
				var def = {};
				Array.prototype.forEach.call(document.querySelectorAll('.customcsv__select-container'), function(el, i) {
					var headerName = el.getAttribute('data-header'),
					val = el.querySelector('select[name=type]').value;
					def[headerName] = {
						type: val
					};
					if (val === 'location') {
						def[headerName].locationType = el.querySelector('select[name=locationType]').value;
						def[headerName].locationRole = el.querySelector('select[name=locationRole]').value;
						var order = {  // TODO: not sure how best to handle this atm
							'origin': 1,
							'exporter': 2,
							'transit': 3,
							'importer': 4
						};
						def[headerName].locationOrder = order[def[headerName].locationRole];
					}
				});

				document.body.classList.remove('has-overlay');
				document.body.removeChild(containerEl);

				callback(def);

			});

		}
	};
});
