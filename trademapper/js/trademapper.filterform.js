
define(["d3"], function(d3) {
	"use strict";

	return {

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
			var yearInfo = filters[yearColumn];

			var yearFieldset = formElement.append("fieldset")
				.attr("class", "filters-group group-year");
			yearFieldset.append("legend")
				.attr("class", "filter-group-title year")
				.text("Year range");

			var yearP = yearFieldset.append("p")
				.attr("class", "form-item key-year-from");
			yearP.append("label")
				.attr("for", "year-select-from")
				.text("From");
			var yearSelect = yearP.append("select")
				.attr("id", "year-select-from");
			for (var year = yearInfo.min; year <= yearInfo.max; year++) {
				yearSelect.append("option")
					.attr("value", year.toString())
					.text(year.toString());
			}

			yearP = yearFieldset.append("p")
				.attr("class", "form-item key-year-to");
			yearP.append("label")
				.attr("for", "year-select-to")
				.text("To");
			yearSelect = yearP.append("select")
				.attr("id", "year-select-to");
			for (year = yearInfo.min; year <= yearInfo.max; year++) {
				yearSelect.append("option")
					.attr("value", year.toString())
					.text(year.toString());
			}
		},

		addCategoryField: function(fieldset, filters, columnName) {
			var cName = this.columnNameToClassName(columnName);
			var values = filters[columnName].values;
			values.sort();

			var categoryP = fieldset.append("p")
				.attr("class", "form-item key-category-" + cName);
			categoryP.append("label")
				.attr("for", cName + "-select")
				.text(columnName);
			var categorySelect = categoryP.append("select")
				.attr("id", cName + "-select");

			if (values.length > 1) {
				categorySelect.append("option")
					.attr("value", "")
					.text("Any " + columnName);
			}
			for (var i = 0; i < values.length; i++) {
				categorySelect.append("option")
					.attr("value", values[i])
					.text(values[i]);
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
