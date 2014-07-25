#!/bin/sh

set -e

if [ -f subunits.json ]; then
    rm subunits.json
fi

# extract just African countries into subunits.json
ogr2ogr \
    -f GeoJSON \
    -where "continent NOT IN ('Antarctica')" \
    subunits.json \
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
    -o world.json \
    subunits.json

# make a readable version of the json
cat world.json | python -mjson.tool > world.pp.json

echo 'define([], ' > worldmap.js
cat world.json >> worldmap.js
echo ');' >> worldmap.js

cp worldmap.js ../trademapper/js/
