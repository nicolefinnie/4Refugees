#!/bin/bash
mongoimport --type=tsv -f geonameid,name,asciiname,alternatenames,latitude,longitude,featureclass,featurecode,countrycode,cc2,admin1code,admin2code,admin3code,admin4code,population,elevation,dem,timezone,mod -d mean-dev -c locations cities15000.txt
