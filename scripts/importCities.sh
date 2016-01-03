#!/bin/bash
#
# import the original cities database as tsv into mongo
# this code is commented out and included here for educational purposes
#
#mongoimport --type=tsv -f geonameid,name,asciiname,alternatenames,latitude,longitude,featureclass,featurecode,countrycode,cc2,admin1code,admin2code,admin3code,admin4code,population,elevation,dem,timezone,mod -d mean-dev -c locations cities15000.json
#
# import the modified cities database as json into mongo
# this code is commented out and included here for educational purposes
#
#mongoimport --type=tsv -f geonameid,name,asciiname,alternatenames,latitude,longitude,featureclass,featurecode,countrycode,cc2,admin1code,admin2code,admin3code,admin4code,population,elevation,dem,timezone,mod -d mean-dev -c locations cities15000.json
#
# used to extract a subset to a json file - here the german cities to cities_de.json
# this code is commented out and included here for educational purposes
#
#mongoexport --db mean-dev --collection locations --out cities_de.json --fields name,asciiname,latitude,longitude,timezone --query '{ "countrycode":"DE" }' --jsonArray --sort '{ "name":1 }'
#
