---
permalink: /starting/
layout:    default
title:     Getting Started
---
##YouTube tutorials 

<a href="https://www.youtube.com/watch?v=Bnsr5Hpt07k">How do I import data?</a> 

<a href="https://www.youtube.com/watch?v=EIklmvz_KiU">What if my data doesn't contain 2- letter country codes?</a> 

<a href="https://www.youtube.com/watch?v=B4ND5ZmuPhU">What if my location is given in coordinates?</a> 

##Getting started

Below are steps for getting started with TradeMapper. Please read these in conjuction with the rest of the information on this website.

1) Select the 'Data' tab and navigate to your .csv file. Files can be accessed from your computer or online using a url _(e.g. paste http://trademapper.aptivate.org/sample_data/cites/cites_unicorn.csv into the box_).

2) If your data is from the CITES or ETIS databases then it should import and draw instantly onto the map.

3) If your data does not come from CITES or ETIS, a Custom CSV Importer box will appear. This interface allows you to map any data by telling TradeMapper which columns to look in for certain information (such as the year, or the location).

4) Use the orange boxes in the Custom CSV Importer interface to assign each column a role:

  * __Ignore__ - TradeMapper will ignore this column so it will not be possible to filter on at a later stage. This is useful   when you have lots of columns in your .csv which are irrelevant.
 
  * __Location__ - This should be used when a column contains information on a location in the trade chain. If you select Location, two further boxes will appear underneath which allow you to select;
  
     * The type of location data (Country Code (e.g. TZ), Country Code (Multiple values) (e.g. TZ, UG, HK) or Latitude/Longitude Place Name (e.g. Chitwan National Park).
     
     * The role of the location in the trade chain (origin, exporter, transit, importer). These different roles are symbolised by different coloured points on the map.
     
     * An orange Location Order circle will also appear underneath. TradeMapper uses this number to draw the locations in the correct order (e.g. type '1' if this location is the first in the trade chain, type '2' if it is the second etc.).

  * __Location Coordinates__ - This should be used when a column contains specific geographical coordinates (GPS) rather than a 2-letter country code. If this option is selected, one further box will appear underneath:
 
     * This box can be used to specify if the data in that column is the Latitude or the Longitude. The latitude and longitude of the location must be stored in separate columns. 
 
     * An orange Location Order circle will also appear underneath (see Location for more details). The three columns containing the Latitude, Longitude and Latitude/longitude Place Name for each location must have the same number in the Location Order circle to allow TradeMapper to understand that these three columns relate to the same one location.

  * __Quantity__ - This should be used for columns which contain information on the volume of trade. Multiple columns can be assigned as the Quantity: this is useful when you have different quantities for the same trade (e.g. weight in kg, weight in tonnes, value in USD). 
 
  * __Text__ - This should be used for columns containing data stored as text which you wish to be able to filter on (e.g. species name, method of transport, purpose or source codes). If this option is selected, a tick box will appear underneath asking if this column contains units (e.g. kg).
 
 * __Text (Multiple Values)__ - This should be used for columns containing multiple values stored as text which you wish to appear as separate values in the filters (e.g. Suspects' nationality may be stored as 'TZ, CN, VN'. Choosing Text (Multiple Values) means each of the three nationalities will be treated as an individual value, whereas choosing Text will treat this just as one value).

 * __Year__ - This should be used for columns containing the year (e.g. 2012).

TradeMapper will attempt to auto-assign roles to each of the columns but you should alyways check these are correct.

5) Click Done. The Custom CSV Importer box can be found on the 'Filters' tab and accessed at any time.

6) Check the 'Data' tab to see if any errors have occured.

7) On the 'Filters' tab, select the correct column for ‘Quantity’. TradeMapper uses data from this column to draw the arrows, and the thickness of the arrow is based on this. The legend for the arrows and points will appear on the map automatically.

8) Use the filters on the 'Filters' tab if required. Changes to the map will be instant when you change something in the filters.

9) Use the 'Hide' tab to hide the control panel to allow more of the map to be shown.

10) Hover over arrows to get a pop up box which contains detailed information for that specific arrow. Pop up boxes can be dragged to a new location or closed by pressing the ‘X’ in the box.  Hover over the symbols which relate to each country's role in the hover box to reveal their meaning (e.g. black circle with cross means origin), or hover over the 2-letter country code in the hover box to see the full country name.

11) Zoom in using the wheel on your mouse if required.

12) Pan by clicking on the map with your mouse and dragging if required.

13) Click the Play button at the bottom of the screen to view an animation of the data over time. Click the Pause button or drag the slider to a specific year to investigate further. Click the Year Slide off to return to the filters. _(Zoom/pan is disabled when using the change over time function)_.

14) Share your map by:

  * Taking a screenshot
  * Embedding the .csv in the url and sharing.







