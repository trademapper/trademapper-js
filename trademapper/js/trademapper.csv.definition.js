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
					locationRole: "importer",
					multiselect: true
				},
				"Exporter": {
					type: "location",
					locationOrder: 2,
					locationType: "country_code",
					locationRole: "exporter",
					multiselect: true
				},
				"Origin": {
					type: "location",
					locationOrder: 1,
					locationType: "country_code",
					locationRole: "origin",
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
					isUnit: true,
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
				// OLD: "ETIS Reference Number ","Folio Number ","Status ","Date of last update ","Date of information ","Year of seizure ","Date of seizure ","Sources ","Agencies ","Source reliability ","Data completeness ranking ","Activities ","Where discovered - place ","Where discovered - city ","Where discovered - country ","Countries of origin ","Countries of origin (raw ivory) ","Countries of origin (worked ivory) ","Countries of export/re-export ","Countries of transit ","Country of destination/import ","Elephant species ","Raw ivory - # tusks/pieces ","Raw ivory - weight (kg) ","Worked ivory - # pieces ","Worked ivory - weight (kg) ","Ivory comment ","Hide/skin - #pieces ","Hide/skin - weight (kg) ","Hide product - pieces ","Hide product - weight (kg) ","Hide product - type ","Other elephant products - pieces ","Other elephant products - weight (kg) ","Other elephant products ","Other contraband ","Estimated value of seizure ","Mode of transport ","Method of concealment ","Method of detection ","Suspects' nationalities ","Additional information ","Mode of data collection ","Internal reference code "
				// OLD: ETIS Ref. No.,Seizure Year,Seizure Date,Source of Data,Agency responsible for seizure,Activity,Place of discovery,City of discovery,Country of Discov-ery,Countries of origin,Countries of export/re-export,Countries of transit,Country of destina-tion/im-port,Raw Ivory No. Pcs,Raw Ivory  Wt (kg),Worked Ivory No. Pcs,Worked Ivory Wt (kg),Ivory Comment,Other Contraband Seized,Mode of Transport,Method of Concealment,Method of Detection,Suspects' Nationalities,Additional Information
				// ETIS ID No.,Folio number,Status ID,Updated at,Report Date,Seizure year,Seizure Date,Source of Data,Agency,Source grade,Data Rank,Activities,Discovered place,Discovered city,Cty Dis,Cty Org,Raw country codes,Worked country codes,Cty Exp,Cty Tra,Cty Des,Species,Raw Iv No. Pcs,Raw Iv Wt (kg),Worked Iv No. Pcs,Worked Iv Wt (kg),Ivory comment,Hide/skin No. Pcs,Hide/skin Wt (kg),Hide Product No. Pcs,Hide Product Wt (kg),Hide Product,Other No. Pcs,Other Wt (kg),Other Product Type,Other contraband,Estimated value,Mode of transport,Method of concealment,Detection methods,Susp Nat,Additional information,Mode of data collection,Internal reference code
				"ETIS ID No.": {
					type: "ignore"
				},
				"Folio number": {
					type: "ignore"
				},
				"Status ID": {
					type: "ignore"
				},
				"Updated at": {
					type: "ignore"
				},
				"Report Date": {
					type: "ignore"
				},
				"Seizure year": {
					type: "year"
				},
				"Seizure Date": {
					type: "ignore"
				},
				"Source of Data": {
					type: "text_list",
					multiselect: true
				},
				"Agency": {
					type: "text_list",
					multiselect: true
				},
				"Source grade": {
					type: "text",
					multiselect: true
				},
				"Data Rank": {
					type: "text",
					multiselect: true
				},
				"Activities": {
					type: "text_list",
					multiselect: true
				},
				"Discovered place": {
					type: "text",
					multiselect: true
				},
				"Discovered city": {
					type: "text",
					multiselect: true
				},
				"Cty Dis": {
					// TODO: seizing/discovery is a point already on the route
					// need to decide how to show this
					shortName: "Country Discovered",
					type: "ignore"
				},
				"Cty Org": {
					// TODO: strictly the countries here are in parallel, not series
					// don't know how to display.  So we need to report multiple countries
					// as an error
					shortName: "Origin",
					type: "location",
					locationOrder: 1,
					locationType: "country_code",
					locationRole: "origin",
					multiselect: true
				},
				"Raw country codes": {
					// origin countries raw ivory
					type: "ignore"
				},
				"Worked country codes": {
					// origin countries worked ivory
					type: "ignore"
				},
				"Cty Exp": {
					shortName: "Exporter",
					type: "location",
					locationOrder: 2,
					locationType: "country_code_list",
					locationRole: "exporter",
					multiselect: true
				},
				"Cty Tra": {
					shortName: "Transit",
					type: "location",
					locationOrder: 3,
					locationType: "country_code_list",
					locationRole: "transit",
					multiselect: true
				},
				"Cty Des": {
					shortName: "Destination",
					type: "location",
					locationOrder: 4,
					locationType: "country_code",
					locationRole: "importer",
					multiselect: true
				},
				"Species": {
					type: "text",
					multiselect: true
				},
				"Raw Iv No. Pcs": {
					shortName: "Raw Ivory No. Pieces",
					type: "quantity"
				},
				"Raw Iv Wt (kg)": {
					type: "quantity"
				},
				"Worked Iv No. Pcs": {
					type: "quantity"
				},
				"Worked Iv Wt (kg)": {
					type: "quantity"
				},
				"Ivory comment": {
					type: "ignore"
				},
				"Hide/skin No. Pcs": {
					type: "quantity"
				},
				"Hide/skin Wt (kg)": {
					type: "quantity"
				},
				"Hide Product No. Pcs": {
					type: "quantity"
				},
				"Hide Product Wt (kg)": {
					type: "quantity"
				},
				"Hide Product": {
					type: "text",
					multiselect: true
				},
				"Other No. Pcs": {
					type: "quantity"
				},
				"Other Wt (kg)": {
					type: "quantity"
				},
				"Other Product Type": {
					type: "text",
					multiselect: true
				},
				"Other contraband": {
					type: "text",
					multiselect: true
				},
				"Estimated value": {
					// think about what to do with money - treat as quantity?
					type: "ignore"
				},
				"Mode of transport": {
					type: "text",
					multiselect: true
				},
				"Method of concealment": {
					type: "text",
					multiselect: true
				},
				"Detection methods": {
					type: "text_list",
					multiselect: true
				},
				"Susp Nat": {
					shortName: "Suspects Nationality",
					type: "text",
					multiselect: true
				},
				"Additional information": {
					type: "ignore"
				},
				"Mode of data collection": {
					type: "ignore"
				},
				"Internal reference code": {
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
					locationRole: "origin",
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
					locationRole: "transit",
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
					locationRole: "transit",
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
					locationRole: "transit",
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
					locationRole: "importer",
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
			"etisidno,folionumber,statusid,updatedat,reportdate,seizureyear,seizuredate,sourceofdata,agency,sourcegrade,datarank,activities,discoveredplace,discoveredcity,ctydis,ctyorg,rawcountrycodes,workedcountrycodes,ctyexp,ctytra,ctydes,species,rawivnopcs,rawivwtkg,workedivnopcs,workedivwtkg,ivorycomment,hideskinnopcs,hideskinwtkg,hideproductnopcs,hideproductwtkg,hideproduct,othernopcs,otherwtkg,otherproducttype,othercontraband,estimatedvalue,modeoftransport,methodofconcealment,detectionmethods,suspnat,additionalinformation,modeofdatacollection,internalreferencecode": "etis",
			"species,quantity,origin,originlat,originlong,transit1,transit1lat,transit1long,transit2,transit2lat,transit2long,transit3,transit3lat,transit3long,destination,destinationlat,destinationlong": "birdsmuggler"
		}

	};
});
