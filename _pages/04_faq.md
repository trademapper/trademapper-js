---
permalink: /faq/
layout:    default
title:     Frequently Asked Questions
---

__What format does my dataset need to be in?__
   Currently TradeMapper will only recognise CSV files (comma separated-values). Data stored in Excel can easily be converted to CSV (File->Save as-> CSV (Comma delimited). Do not use any commas within your numerical data as TradeMapper will treat the data incorrectly (e.g. 100,000 should be 100000).

__Which country name should I use (e.g. DRC or Democratic Republic of Congo)?__
   TradeMapper only recognises 2-letter ISO country codes (e.g. United Kingdom = GB). This is a widely used standard and 2-letter country codes can be found in ‘A guide to using the CITES Trade Database’ http://trade.cites.org/cites_trade_guidelines/en-CITES_Trade_Database_Guide.pdf.

TradeMapper uses 2-letter ISO codes as they are less prone to spelling mistakes and grammatical errors, and outputs from certain data sources automatically use this standard. TradeMapper will give an error message if you import data containing non-country specific ISO codes (e.g. XF, XX) or country names which no longer exist (e.g. DD (Former East Germany)).

As well as country codes, TradeMapper also works with locations given as geographical coordinates.

__Why are some countries green?__
If a country is involved in the trade (either as origin, exporter, transit, importer) then it will be highlighted in green on the map. This makes it easier to determine which countries are involved and which are not. In some rare cases, overseas territories/regions may also be green (e.g. French Guiana if France is involved in trade).

__What do the coloured circles mean?__
The coloured circles (points) represent the different role(s) a country plays in the trade chain: a country could be the origin of the wildlife product, it could be an exporter, a transit point or an importer. A country can have multiple roles so may have more than one coloured dot. You assign these roles using the Custom CSV Importer box. Check the legend on the map to find out which colour relates to which role.

__What do the grey diagonal lines over some countries mean?__
These lines symbolise disputed regions or territories such as Kashmir. This data comes from www.naturalearthdata.com and doesn't imply an opinion of the legal status of borders/territories by TRAFFIC or WWF.

__How can I make arrows merge?__
In certain cases it may be useful to make all the arrows travelling in the same direction into one thick arrow rather than several thin arrows. This is possible by adding “/?arrowtype=flowmap” to the end of the url. However, this does have several limitations (e.g. pop up boxes no longer work, there are bends in the arrows when smaller arrows split off which can appear like transit points). Hopefully future development will improve this function but for now please be wary and make sure you understand exactly what you are doing.

__How can I change the size of the arrows?__
The default maximum thickness of arrows is currently 30 pixels. If this seems too thick or thin it is possible to manually change it by adding ”/?maxarrowwidth=10” to the end of the url (this will reduce it to 10 pixels but any number can be used).

__How can I create an image__
Images can be created by pressing the print screen button on your keyboard and pasting it into a document/editing program. There are also a number of ‘snipping’ add ons for your browser which can be downloaded and allow any portion of the screen to be selected and saved as an image (rather than print screen which takes the entire screen).

__How secure is TradeMapper?__
TradeMapper runs locally on your computer so no information is transmitted via the internet when using a .csv file stored on your computer.
