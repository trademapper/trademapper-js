---
permalink: /faq/
layout:    default
title:     Frequently Asked Questions
---

__What format does my dataset need to be in?__
   Currently TradeMapper will only recognise CSV files (comma separated-values). Data stored in Excel can easily be converted to CSV (File->Save as-> CSV (Comma delimited). Do not use any commas within your numerical data as TradeMapper will treat the data incorrectly (e.g. 100,000 should be 100000). Do not have zeros in your dataset, leave the cells blank instead.

__Which country name should I use (e.g. DRC or Democratic Republic of Congo)?__
   TradeMapper only recognises 2-letter ISO country codes (e.g. United Kingdom = GB). This is a widely used standard and 2-letter country codes can be found in ‘A guide to using the CITES Trade Database’ http://trade.cites.org/cites_trade_guidelines/en-CITES_Trade_Database_Guide.pdf.

TradeMapper uses 2-letter ISO codes as they are less prone to spelling mistakes and grammatical errors, and outputs from certain data sources automatically use this standard. TradeMapper will give an error message if you import data containing non-country specific ISO codes (e.g. XF, XX) or country names which no longer exist (e.g. DD (Former East Germany)).

As well as country codes, TradeMapper also works with locations given as geographical coordinates.

__Why are some countries dark grey?__
If a country is involved in the trade (either as origin, exporter, transit, importer) then it will be highlighted in dark grey on the map. This makes it easier to determine which countries are involved and which are not. In some rare cases, overseas territories/regions may also be dark grey (e.g. French Guiana if France is involved in trade).

__What do the coloured circles mean?__
The coloured circles (points) represent the different role(s) a country plays in the trade chain: a country could be the origin of the wildlife product, it could be an exporter, a transit point or an importer. A country can have multiple roles so may have more than one coloured dot. You assign these roles using the Custom CSV Importer box. Check the legend on the map to find out which colour relates to which role.

__What do the grey diagonal lines over some countries mean?__
These lines symbolise disputed regions or territories such as Kashmir. This data comes from www.naturalearthdata.com and doesn't imply an opinion of the legal status of borders/territories by TRAFFIC or WWF.

__How do I add map layers?__
TradeMapper can display map layers (polygons, lines, points) that are in TopoJSON format. You can include up to three map layers in one map. The colours of the map layers are pre-determined (green, yellow, red).
If you have map layers in different formats (e.g. Shapefiles, GeoJSON, CSV) then you can easily convert them to TopoJSON using a free tool called Mapshaper https://mapshaper.org/. THIS TAKES LESS THAN 3 MINUTES!
Your map layer must be in the coordinate system WGS84. If your layer is in a different coordinate system you will need to convert it (using a GIS such as ArcGIS or QGIS).

Step by Step Guide to Converting from Shapefile to TopoJSON
1.	Navigate to https://mapshaper.org/
2.	Click “select” and navigate to your saved Shapefile
3.	Select all the files that make up a Shapefile (.CPG, .DBF, .PRJ, .SHP, .SHX) and click Open 
4.	Click Import (keep the default settings that Mapshaper suggests)
5.	A map of your Shapefile will appear. Click Export and select TopoJSON. Your TopoJSON map layer is ready to load into TradeMapper!

Step by Step Guide to Simplifying a map layer
1.	If the TopoJSON layer is unnecessarily complex (e.g. a species’ range that is very detailed) you can simplify it in Mapshaper. Follow steps 1-5 above to produce a TopoJSON. 
2.	Load your TopoJSON into Mapshaper using the same method detailed above for a Shapefile.
3.	Click Simplify (keep the default settings that Mapshaper suggests) and use the Slider at the top of the screen to simplify the layer as much as you want.
4.	Click Export (as TopoJSON) and your simplified layer is ready to load into TradeMapper!
5. To load the map layer into TradeMapper, simply navigate to http://www.trademapper.co.uk/ (if you haven’t already) and click Add Map Layer.   


__How can I change the size of the arrows?__
The default maximum thickness of arrows is currently 30 pixels. If this seems too thick or thin it is possible to manually change it by adding ”/?maxarrowwidth=10” to the end of the url (this will reduce it to 10 pixels but any number can be used).

__How can I create an image/animation__
Once your trade data has been loaded into TradeMapper, an Export tab will appear in the panel on the left. Maps can be exported as PNGs (a common image format that can be used by programs such as Word and PowerPoint) or SVG (scalable vector file format which can be imported by programs such as Photoshop, or converted to other image file formats). If the trade data contains data from more than one year, you can also export an animated GIF showing the change over time. This GIF can be added to presentations or shared on social media.

__How secure is TradeMapper?__
TradeMapper runs locally on your computer so no information is transmitted via the internet when using a .csv file stored on your computer.

__How can I make arrows merge?__
In certain cases it may be useful to make all the arrows travelling in the same direction into one thick arrow rather than several thin arrows. This is possible by adding “/?arrowtype=flowmap” to the end of the url. However, this does have several limitations (e.g. pop up boxes no longer work, there are bends in the arrows when smaller arrows split off which can appear like transit points). Hopefully future development will improve this function but for now please be wary and make sure you understand exactly what you are doing.

__Why won't my CSV work?__
If there is a problem with your CSV then it will not display correctly in TradeMapper. The Custom CSV Importer Box will still appear but instead of neatly being aligned into the correct columns, it will look strange:

![TradeMapper](https://github.com/trademapper/trademapper-js/blob/staging/TradeMapper_cover.png)


