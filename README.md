trademapper-js
==============

Javascript application and libraries for mapping international trade using
[d3.js](http://d3js.org/)  It runs in the browser, and you can import data
from CSV files, view the trade on the map, filter by various columns, and
zoom and pan around the resulting map.

![TradeMapper in action](https://raw.githubusercontent.com/trademapper/trademapper-js/master/screenshot/trademapper.png)

What is TradeMapper?
--------------------

The illegal trade in wildlife threatens some of our planet’s most iconic
species such as rhinos, tigers and elephants, and evolves rapidly; taking
advantage of new routes and other opportunities to avoid detection. To
understand and manage the ever-changing trade effectively, scientists and
conservationists need to work with large volumes of data that describe
international movement of wildlife and wildlife products (like ivory and rhino
horn). This helps them understand the spatial patterns of trade, and determine
what factors are influencing it and how these can be addressed.  These findings
then need to be communicated clearly and effectively with decision-makers and
the public.  Only then can solutions be found, and wildlife protected.

To help, we built TradeMapper: an open source interactive browser-based tool
that maps international wildlife trade flow data, allowing users to visualise
the global trade in wildlife.  TradeMapper offers a way to explore trends, both
historical and geographical, in a way that is simply impossible when dealing
with dry numerical data in a spreadsheet.

But ultimately, TradeMapper is not limited to wildlife data - it can map
international trade of any variety.

Playing with the code
---------------------

You can see some [test data preloaded](http://trademapper.aptivate.org/?csvtype=cites&loadcsv=http://trademapper.aptivate.org/sample_data/cites/cites_unicorn.csv).

Or you can open `trademapper/index.html` in your browser.

After that you'll need some data to load.  Currently TradeMapper accepts data in
CSV format from the CITES and ETIS databases.  You can [download CITES
data](http://trade.cites.org/), and then import it into TradeMapper.  The CSV
data never leaves your computer.

Making your own version
-----------------------

TradeMapper is designed so it can be included in other sites.  With your own
HTML file, CSS and a main.js file, you can pull in the rest of TradeMapper and
have it embedded in your own site.

Running the tests
-----------------

Open `tests/test_runner.html` in your browser.
