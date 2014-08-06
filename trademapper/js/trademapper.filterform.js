
define(["d3"], function(d3) {
	"use strict";

	return {

		/*
		 * This will store the values as 
		 * filterValues[columnName] => {type: <sometype>, ...}
		 *
		 * For category it will look like:
		 * {type: "category-single", any: true/false, value: "value1"}
		 *
		 * For category with multiselect it will look like:
		 * {type: "category-multi", any: true/false, valueList: ["value1", "value2"]}
		 * The any is the top choice.
		 *
		 * For year
		 * {type: "year", minValue: 2003, maxValue: 2008}
		 *
		 * For other numeric ranges
		 * {type: "numeric", minValue: 4, maxValue: 20}
		 */
		filterValues: {},

		anyString: "--------",

		/*
		 * should be set by external program
		 */
		formChangedCallback: function(columnName) {
		},

		getFilterNamesForType: function(filters, filterType) {
			var result = [], temp;

			for (var key in filters) {
				if (filters.hasOwnProperty(key)) {
					if (filters[key].type === filterType) {
						result.push(key);
					}
				}
			}

			return result;
		},

		columnNameToClassName: function(columnName) {
			return columnName.replace(/\W+/, "-");
		},

		addYearFieldset: function(formElement, filters, yearColumn) {
			var yearFieldset, yearP, yearSelect, year, yearOption,
				yearInfo = filters[yearColumn];

			yearFieldset = formElement.append("fieldset")
				.attr("class", "filters-group group-year");
			yearFieldset.append("legend")
				.attr("class", "filter-group-title year")
				.text("Year range");

			yearP = yearFieldset.append("p")
				.attr("class", "form-item key-year-from");
			yearP.append("label")
				.attr("for", "year-select-from")
				.text("From");
			yearSelect = yearP.append("select")
				// TODO: remove disabled once this is working
				.attr("disabled", "disabled")
				.attr("id", "year-select-from");
			for (year = yearInfo.min; year <= yearInfo.max; year++) {
				yearOption = yearSelect.append("option")
					.attr("value", year.toString())
					.text(year.toString());
				if (year === yearInfo.min) {
					yearOption.attr("selected", "selected");
				}
			}

			yearP = yearFieldset.append("p")
				.attr("class", "form-item key-year-to");
			yearP.append("label")
				.attr("for", "year-select-to")
				.text("To");
			yearSelect = yearP.append("select")
				// TODO: remove disabled once this is working
				.attr("disabled", "disabled")
				.attr("id", "year-select-to");
			for (year = yearInfo.min; year <= yearInfo.max; year++) {
				yearOption = yearSelect.append("option")
					.attr("value", year.toString())
					.text(year.toString());
				if (year === yearInfo.max) {
					yearOption.attr("selected", "selected");
				}
			}

			this.filterValues[yearColumn] = {
				type: "year",
				minValue: yearInfo.min,
				maxValue: yearInfo.max
			};
		},

		addCategoryField: function(fieldset, filters, columnName) {
			var cName = this.columnNameToClassName(columnName);
			var values = filters[columnName].values;
			var multiselect = filters[columnName].multiselect;
			values.sort();

			var categoryP = fieldset.append("p")
				.attr("class", "form-item key-category-" + cName);
			categoryP.append("label")
				.attr("for", cName + "-select")
				.text(columnName);
			var categorySelect = categoryP.append("select")
				.attr("id", cName + "-select");
			if (multiselect) {
				categorySelect.attr("class", "multiselect");
			}

			if (values.length > 1) {
				categorySelect.append("option")
					.attr("value", this.anyString)
					.text("Any " + columnName);
			}
			for (var i = 0; i < values.length; i++) {
				categorySelect.append("option")
					.attr("value", values[i])
					.text(values[i]);
			}

			var moduleThis = this;
			categorySelect.on("change", function() {
				// the data/index arguments d3 gives us are useless, so gather
				// the info we need in this closure
				// `this` currently refers to the select element
				if (this.value === moduleThis.anyString) {
					moduleThis.filterValues[columnName].any = true;
					if (multiselect) {
						moduleThis.filterValues[columnName].valueList = [];
					} else {
						moduleThis.filterValues[columnName].value = null;
					}
				} else {
					moduleThis.filterValues[columnName].any = false;
					if (multiselect) {
						moduleThis.filterValues[columnName].valueList = [this.value];
					} else {
						moduleThis.filterValues[columnName].value = this.value;
					}
				}
				moduleThis.formChangedCallback(columnName);
			});

			if (multiselect) {
				this.filterValues[columnName] = {
					type: "category-multi",
					any: true,
					valueList: []
				};
			} else {
				this.filterValues[columnName] = {
					type: "category-single",
					any: true,
					valueList: null
				};
			}
		},

		createFormFromFilters: function(formElement, filters) {
			var i, yearFilters, categoryFilters, categoryFieldset;

			// TODO: recreate country filter stuff

			yearFilters = this.getFilterNamesForType(filters, "year");
			if (yearFilters.length === 1) {
				this.addYearFieldset(formElement, filters, yearFilters[0]);
			} else if (yearFilters.length > 1) {
				console.log('More than one column with type "year" !!!');
			}

			categoryFilters = this.getFilterNamesForType(filters, "text");
			if (categoryFilters.length > 0) {
				categoryFieldset = formElement.append("fieldset")
					.attr("class", "filters-group group-category");
				categoryFieldset.append("legend")
					.attr("class", "filter-group-title category")
					.text("Categories");
			}
			for (i = 0; i < categoryFilters.length; i++) {
				this.addCategoryField(categoryFieldset, filters, categoryFilters[i]);
			}

			/* TODO:
			var numericFieldset = formElement.append("fieldset")
				.attr("class", "filters-group group-numeric");
			*/
		}
	};
});
