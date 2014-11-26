---
permalink: /starting/
layout:    default
title:     Getting Started
---

###Getting Started

1) Select the 'Data' tab and navigate to your .csv file. Files can be accessed from your computer or online using a url.

2) If your data is from the CITES or ETIS database then it should draw instantly on the map.

3) If your data does not come from CITES or ETIS, a Custom CSV Importer box will appear. This interface allows you to map any data by telling TradeMapper which columns to look in for certain information (such as the year, or the location).

4) Use the orange box to assign each column a role;

  * Ignore - TradeMapper will ignore this column so it will not be possible to filter on at a later stage. This is useful   when you have lots of columns in your .csv which are irrelevant.
 
  * Location - This should be used when a column contains information on a location in the trade chain. If you select Location, two further boxes will appear underneath which allow you to select;
     * The type of location data (Country Code (e.g. TZ), Country Code (Multiple values) (e.g. TZ, UG, HK) or Latitude/Longitude Place Name (e.g. Chitwan National Park)
     * The role of the location in the trade chain (origin, exporter, transit, importer). These different roles are symbolised by different coloured points on the map.
     * An orange Location Order circle will also appear underneath. TradeMapper uses this number to draw the locations in the correct order (e.g. type '1' if this location is the first in the trade chain, type '2' if it is the second etc.)

  Location Coordinates - This should be used when a column contains specific geographical coordinates (GPS) rather than a 2-letter country code. If this option is selected, one further box will appear underneath. 
     * This box can be used to specify if the data in that column is the Latitude or the Longitude. The latitude and longitude of the location must be stored in separate columns. 
      * An orange Location Order circle will also appear underneath (see Location for more details). The three columns containing the latitude, longitude and latitude/longitude place name for each location must have the same number in the Location Order circle to allow TradeMapper to understand that these three columns relate to the same one location.
 
  * Quantity - This should be used for columns which contain information on the volume of trade. Multiple columns can be assigned as the Quantity: this is useful for when you have different quantities for the same trade (e.g. weight in kg, weight in tonnes, value in USD). 
 
  * Text - This should be used for columns containing data stored as text which you wish to be able to filter on (e.g. species name, method of transport, purpose or source codes). If this option is selected, a tick box will appear underneath asking if this column contains units (e.g. kg).
 
 * Text (Multiple Values) - This should be used for columns containing multiple values stored as text which you wish to appear as separate values in the filters (e.g. Suspects' nationality may be stored as 'TZ, CN, VN'. Choosing Text (Multiple Values) means each of the three nationalities will be treated as an individual value, whereas choosing Text will treat this just as one value).

 * Year - This should be used for columns containing the year (e.g. 2012).

heck to see if an ‘Errors’ message has appeared in white text at the top-right hand of the screen. Click ‘Show’ to read the full message which explains why a particular row(s) was not drawn on the map.
Use the filters in the control panel (left hand side of the screen) if required. It may be useful to select one specific country if you are. Changes to the map will be instant when you change something in the filters.
Select the correct column heading for ‘Quantity’ in the control panel. TradeMapper uses data from this column to draw the arrows, and the thickness of the arrow is based on this.
Add text in the title box in the control panel if required. 
Hover over arrows to get a pop up box which contains detailed information for that specific arrow. Pop up boxes can be dragged to a new location or closed by pressing the ‘X’ in the box. 
Zoom in using the wheel on your mouse if required.
Pan by clicking on the map with your mouse and dragging if required.
Resize or reshape the map window if required.
Create an image by taking a screenshot of your map if required.


Links to youtube tutorials
