define(
  ['QUnit', 'trademapper.mapper', 'd3', 'config'],
  function(q, mapper, d3, configFile) {
    "use strict";
    var
      run = function() {
        q.module("Mapper", {
          setup: function() {
            var newsvg = d3.select(document.createElement("div")).append('svg');
            var svgdefs = newsvg.append('defs');
            var zoomg = newsvg.append('g');
            var controlg = newsvg.append('g');

            var config = {
              arrowType: "plain-arrows" ,
              width: 1200, // parseInt(this.newsvg.style('width')),
              height: 600, // parseInt(this.newsvg.style('height'))
							styles: configFile.styles,
            };
            mapper.init(zoomg, controlg, svgdefs, config, newsvg);
          }
        });

        q.test('check mapper.findExtend ', function extendTest() {
          var countries ={
                            "AD":{point: [1.601554,42.546245]},
                            "AE":{point: [53.847818,23.424076]},
                            "AF":{point: [67.709953,33.93911]},
                            "NZ":{point: [174.885971,-40.900557]},
                            "MX":{point: [-102.552784,23.634501]}
                          };
          /* [​[left, bottom], [right, top]​] */
          q.deepEqual(mapper.findExtent(countries),[[ -102.552784,-40.900557], [174.885971, 42.546245]]);
        });
      };
    return {run: run};
  }
);
