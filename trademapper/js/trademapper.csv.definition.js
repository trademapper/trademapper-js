define([], function() {
	"use strict";
	return {

		filterSpec: {
			cites: {
				// the header of the CITES CSV is:
				// Year,App.,Family,Taxon,Importer,Exporter,Origin,Importer reported quantity,Exporter reported quantity,Term,Unit,Purpose,Source
				"Year": {
					type: "year"
				},
				"App.": {
					type: "text",
					multiselect: true
				},
				"Family": {
					type: "text",
					multiselect: true
				},
				"Taxon": {
					type: "text",
					multiselect: true
				},
				"Importer": {
					type: "location",
					locationOrder: 3,
					locationType: "country_code",
					multiselect: true
				},
				"Exporter": {
					type: "location",
					locationOrder: 2,
					locationType: "country_code",
					multiselect: true
				},
				"Origin": {
					type: "location",
					locationOrder: 1,
					locationType: "country_code",
					multiselect: true
				},
				"Importer reported quantity": {
					type: "quantity"
				},
				"Exporter reported quantity": {
					type: "quantity"
				},
				"Term": {
					type: "text",
					multiselect: true
				},
				"Unit": {
					type: "text",
					multiselect: false  // doesn't make sense to have multiselect
				},
				"Purpose": {
					type: "text",
					multiselect: true
				},
				"Source": {
					type: "text",
					multiselect: true
				}
			},

			etis: {
				// the header of the ETIS CSV is:
				// "ETIS Reference Number ","Folio Number ","Status ","Date of last update ","Date of information ","Year of seizure ","Date of seizure ","Sources ","Agencies ","Source reliability ","Data completeness ranking ","Activities ","Where discovered - place ","Where discovered - city ","Where discovered - country ","Countries of origin ","Countries of origin (raw ivory) ","Countries of origin (worked ivory) ","Countries of export/re-export ","Countries of transit ","Country of destination/import ","Elephant species ","Raw ivory - # tusks/pieces ","Raw ivory - weight (kg) ","Worked ivory - # pieces ","Worked ivory - weight (kg) ","Ivory comment ","Hide/skin - #pieces ","Hide/skin - weight (kg) ","Hide product - pieces ","Hide product - weight (kg) ","Hide product - type ","Other elephant products - pieces ","Other elephant products - weight (kg) ","Other elephant products ","Other contraband ","Estimated value of seizure ","Mode of transport ","Method of concealment ","Method of detection ","Suspects' nationalities ","Additional information ","Mode of data collection ","Internal reference code "
				// ETIS Ref. No.,Seizure Year,Seizure Date,Source of Data,Agency responsible for seizure,Activity,Place of discovery,City of discovery,Country of Discov-ery,Countries of origin,Countries of export/re-export,Countries of transit,Country of destina-tion/im-port,Raw Ivory No. Pcs,Raw Ivory  Wt (kg),Worked Ivory No. Pcs,Worked Ivory Wt (kg),Ivory Comment,Other Contraband Seized,Mode of Transport,Method of Concealment,Method of Detection,Suspects' Nationalities,Additional Information
				"ETIS Reference Number ": {
					type: "ignore"
				},
				"Folio Number ": {
					type: "ignore"
				},
				"Status ": {
					type: "ignore"
				},
				"Date of last update ": {
					type: "ignore"
				},
				"Date of information ": {
					type: "ignore"
				},
				"Year of seizure ": {
					type: "year"
				},
				"Date of seizure ": {
					type: "ignore"
				},
				"Sources ": {
					type: "text",
					multiselect: true
				},
				"Agencies ": {
					type: "text",
					multiselect: true
				},
				"Source reliability ": {
					type: "text",
					multiselect: true
				},
				"Data completeness ranking ": {
					type: "text",
					multiselect: true
				},
				"Activities ": {
					type: "text_list",
					multiselect: true
				},
				"Where discovered - place ": {
					type: "text",
					multiselect: true
				},
				"Where discovered - city ": {
					type: "text",
					multiselect: true
				},
				"Where discovered - country ": {
					// TODO: seizing/discovery is a point already on the route
					// need to decide how to show this
					type: "ignore"
				},
				"Countries of origin ": {
					// TODO: strictly the countries here are in parallel, not series
					// don't know how to display.  So we need to report multiple countries
					// as an error
					type: "location",
					locationOrder: 1,
					locationType: "country_code",
					multiselect: true
				},
				"Countries of origin (raw ivory) ": {
					type: "ignore"
				},
				"Countries of origin (worked ivory) ": {
					type: "ignore"
				},
				"Countries of export/re-export ": {
					type: "location",
					locationOrder: 2,
					locationType: "country_code_list",
					multiselect: true
				},
				"Countries of transit ": {
					type: "location",
					locationOrder: 3,
					locationType: "country_code_list",
					multiselect: true
				},
				"Country of destination/import ": {
					type: "location",
					locationOrder: 4,
					locationType: "country_code",
					multiselect: true
				},
				"Elephant species ": {
					type: "text",
					multiselect: true
				},
				"Raw ivory - # tusks/pieces ": {
					type: "quantity"
				},
				"Raw ivory - weight (kg) ": {
					type: "quantity"
				},
				"Worked ivory - # pieces ": {
					type: "quantity"
				},
				"Worked ivory - weight (kg) ": {
					type: "quantity"
				},
				"Ivory comment ": {
					type: "ignore"
				},
				"Hide/skin - #pieces ": {
					type: "quantity"
				},
				"Hide/skin - weight (kg) ": {
					type: "quantity"
				},
				"Hide product - pieces ": {
					type: "quantity"
				},
				"Hide product - weight (kg) ": {
					type: "quantity"
				},
				"Hide product - type ": {
					type: "text",
					multiselect: true
				},
				"Other elephant products - pieces ": {
					type: "quantity"
				},
				"Other elephant products - weight (kg) ": {
					type: "quantity"
				},
				"Other elephant products ": {
					type: "ignore"
				},
				"Other contraband ": {
					type: "text",
					multiselect: true
				},
				"Estimated value of seizure ": {
					// think about what to do with money - treat as quantity?
					type: "ignore"
				},
				"Mode of transport ": {
					type: "text",
					multiselect: true
				},
				"Method of concealment ": {
					type: "text",
					multiselect: true
				},
				"Method of detection ": {
					type: "text_list",
					multiselect: true
				},
				"Suspects' nationalities ": {
					type: "text",
					multiselect: true
				},
				"Additional information ": {
					type: "ignore"
				},
				"Mode of data collection ": {
					type: "ignore"
				},
				"Internal reference code ": {
					type: "ignore"
				}
			},

			birdsmuggler: {
				// the header of the dummy bird smuggling is
				// Species,Quantity,Origin,Origin Lat,Origin Long,Transit 1,Transit 1 Lat,Transit 1 Long,Transit 2,Transit 2 Lat,Transit 2 Long,Transit 3,Transit 3 Lat,Transit 3 Long,Destination,Destination Lat,Destination long
				"Species": {
					type: "text",
					multiselect: true
				},
				"Quantity": {
					type: "quantity"
				},
				"Origin": {
					type: "location",
					locationOrder: 1,
					locationType: "latLongName",
					multiselect: true
				},
				"Origin Lat": {
					type: "location_extra",
					locationOrder: 1,
					locationType: "latitude"
				},
				"Origin Long": {
					type: "location_extra",
					locationOrder: 1,
					locationType: "longitude"
				},
				"Transit 1": {
					type: "location",
					locationOrder: 2,
					locationType: "latLongName",
					multiselect: true
				},
				"Transit 1 Lat": {
					type: "location_extra",
					locationOrder: 2,
					locationType: "latitude"
				},
				"Transit 1 Long": {
					type: "location_extra",
					locationOrder: 2,
					locationType: "longitude"
				},
				"Transit 2": {
					type: "location",
					locationOrder: 3,
					locationType: "latLongName",
					multiselect: true
				},
				"Transit 2 Lat": {
					type: "location_extra",
					locationOrder: 3,
					locationType: "latitude"
				},
				"Transit 2 Long": {
					type: "location_extra",
					locationOrder: 3,
					locationType: "longitude"
				},
				"Transit 3": {
					type: "location",
					locationOrder: 4,
					locationType: "latLongName",
					multiselect: true
				},
				"Transit 3 Lat": {
					type: "location_extra",
					locationOrder: 4,
					locationType: "latitude"
				},
				"Transit 3 Long": {
					type: "location_extra",
					locationOrder: 4,
					locationType: "longitude"
				},
				"Destination": {
					type: "location",
					locationOrder: 5,
					locationType: "latLongName",
					multiselect: true
				},
				"Destination Lat": {
					type: "location_extra",
					locationOrder: 5,
					locationType: "latitude"
				},
				"Destination long": {
					type: "location_extra",
					locationOrder: 5,
					locationType: "longitude"
				}
			}
		},

		csvHeaderToType: {
			"year,app,family,taxon,importer,exporter,origin,importerreportedquantity,exporterreportedquantity,term,unit,purpose,source": "cites",
			"etisrefno,seizureyear,seizuredate,sourceofdata,agencyresponsibleforseizure,activity,placeofdiscovery,cityofdiscovery,countryofdiscovery,countriesoforigin,countriesofexportreexport,countriesoftransit,countryofdestinationimport,rawivorynopcs,rawivorywtkg,workedivorynopcs,workedivorywtkg,ivorycomment,othercontrabandseized,modeoftransport,methodofconcealment,methodofdetection,suspectsnationalities,additionalinformation": "etis",
			"species,quantity,origin,originlat,originlong,transit1,transit1lat,transit1long,transit2,transit2lat,transit2long,transit3,transit3lat,transit3long,destination,destinationlat,destinationlong": "birdsmuggler"
		}

	};
});
