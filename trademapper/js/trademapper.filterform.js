
define(["d3"], function(d3) {
	"use strict";

	return {
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

		createFormFromFilters: function(formElement, filters) {

			// TODO: recreate country filter stuff

			this.addYearFieldset(formElement, filters, "Year");

			var categoryFieldset = formElement.append("fieldset")
				.attr("class", "filters-group group-category");

			/* TODO:
			var numericFieldset = formElement.append("fieldset")
				.attr("class", "filters-group group-numeric");
			*/
		}
	};
});
