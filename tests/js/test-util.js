define(
	['QUnit', 'util'],
	function(q, util) {
		"use strict";

		var run = function() {
			q.module("Util");

			q.test('check templating', function() {
				var expected = "Hello World! There are 3 days until my birthday!";

				var templateStr = "Hello {{name}}! There are {{numDays}} days until my birthday!";
				var ctx = {
					name: "World",
					numDays: 3,
				};

				var actual = util.renderTemplate(templateStr, ctx);

				q.equal(actual, expected);
			});
		};

		return {run: run};
	}
);
