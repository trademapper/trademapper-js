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
				// ETIS Ref. No.,Seizure Year,Seizure Date,Source of Data,Agency responsible for seizure,Activity,Place of discovery,City of discovery,Country of Discov-ery,Countries of origin,Countries of export/re-export,Countries of transit,Country of destina-tion/im-port,Raw Ivory No. Pcs,Raw Ivory  Wt (kg),Worked Ivory No. Pcs,Worked Ivory Wt (kg),Ivory Comment,Other Contraband Seized,Mode of Transport,Method of Concealment,Method of Detection,Suspects' Nationalities,Additional Information
				"ETIS Ref. No.": {
					type: "ignore"
				},
				"Seizure Year": {
					type: "year"
				},
				"Seizure Date": {
					// TODO: anything?
					type: "ignore"
				},
				"Source of Data": {
					// TODO: sample file has no data for this column
					type: "text",
					multiselect: true
				},
				"Agency responsible for seizure": {
					// TODO: sample file has no data for this column
					type: "text",
					multiselect: true
				},
				"Activity": {
					type: "text_list",
					multiselect: true
				},
				"Place of discovery": {
					type: "text",
					multiselect: true
				},
				"City of discovery": {
					type: "text",
					multiselect: true
				},
				"Country of Discov-ery": {
					// TODO: seizing/discovery is a point already on the route
					// need to decide how to show this
					type: "ignore"
				},
				"Countries of origin": {
					// TODO: strictly the countries here are in parallel, not series
					// don't know how to display
					type: "location",
					locationOrder: 1,
					locationType: "country_code_list",
					multiselect: true
				},
				"Countries of export/re-export": {
					type: "location",
					locationOrder: 2,
					locationType: "country_code_list",
					multiselect: true
				},
				"Countries of transit": {
					type: "location",
					locationOrder: 3,
					locationType: "country_code_list",
					multiselect: true
				},
				"Country of destina-tion/im-port": {
					type: "location",
					locationOrder: 4,
					locationType: "country_code",
					multiselect: true
				},
				"Raw Ivory No. Pcs": {
					type: "quantity"
				},
				"Raw Ivory  Wt (kg)": {
					type: "quantity"
				},
				"Worked Ivory No. Pcs": {
					type: "quantity"
				},
				"Worked Ivory Wt (kg)": {
					type: "quantity"
				},
				"Ivory Comment": {
					type: "ignore"
				},
				"Other Contraband Seized": {
					// TODO: sample file has no data for this column
					type: "ignore"
				},
				"Mode of Transport": {
					type: "text",
					multiselect: true
				},
				"Method of Concealment": {
					type: "ignore"
				},
				"Method of Detection": {
					// TODO: work this out, example suggested multiple values per cell
					type: "text_list",
					multiselect: true
				},
				"Suspects' Nationalities": {
					// TODO: sample file has no data for this column
					type: "ignore"
				},
				"Additional Information": {
					// TODO: sample file has no data for this column
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
