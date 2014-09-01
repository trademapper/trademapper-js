#!/bin/bash

set -e

function json2js {
    json=$1.json
    ppjson=$1.pp.json
    outjs=$2.js

    # make a readable version of the json
    cat $json | python -mjson.tool > $ppjson

    echo 'define([], ' > $outjs
    cat $json >> $outjs
    echo ');' >> $outjs
}

function rmIfPresent {
    if [ -f $1 ]; then
        rm $1
    fi
}

#
# the main map
#

intermediate_json=subunits.json
final_json=world
final_js=worldmap

rmIfPresent $intermediate_json

# extract just African countries into subunits.json
ogr2ogr \
    -f GeoJSON \
    -where "continent NOT IN ('Antarctica')" \
    $intermediate_json \
    ne_110m_admin_0_countries.shp

    #-where "continent IN ('Africa')" \

# convert to topojson (saves lots of space) and drop lots of properties
topojson \
    --id-property 'iso_a2' \
    -p name=NAME \
    -p iso_a2 \
    -p iso_a3 \
    -p name \
    -p formal_en \
    -p region_un \
    -p region_wb \
    -o ${final_json}.json \
    $intermediate_json

json2js ${final_json} ${final_js}

cp ${final_js}.js ../trademapper/js/

#
# the disputed areas
#

intermediate_json=disputeunit.json
final_json=dispute
final_js=disputedareas

rmIfPresent $intermediate_json

# extract just African countries into subunits.json
ogr2ogr \
    -f GeoJSON \
    $intermediate_json \
    ne_10m_admin_0_disputed_areas.shp

# convert to topojson (saves lots of space) and drop lots of properties
topojson \
    --id-property 'sr_brk_a3' \
    -p name=BRK_NAME \
    -p sr_brk_a3 \
    -p BRK_NAME \
    -p BRK_GROUP \
    -p NOTE_BRK \
    -o ${final_json}.json \
    $intermediate_json

json2js ${final_json} ${final_js}

cp ${final_js}.js ../trademapper/js/

