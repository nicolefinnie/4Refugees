'use strict';

// Geo location service, calls into google geo APIs to retrieve current
// location.  If geo-services are not available, caller can ask to retrieve
// a list of pre-set cities to choose from with pre-set coordinates.
angular.module('geo').service('GeoService', [ function () {

  // Define the current location object
  // TODO: Add a date when this location was initialized, refresh periodically
  this.currentLocation = {
    initialized: false, // internal-use only
    available: false,   // geo-location services determined location properly
    city: '',           // nearest city to our current location
    longitude: '',      // current longitude
    latitude: ''        // current latitude
  };

  this.cityList = [{}];
  this.cityListCached = false;

  // Determine the closest city to the current location
  this.findClosestCity = function (geocoderResults) {
    var city = 'Unknown';
    var country = 'Unknown';
    var results = geocoderResults;
    // Search through the returned results to find a reasonably good city + country to display
    // In general, the returned 'results' start from the most specific address, to the most general,
    // and since we only look for city + country (not street address, postal code, etc), we should be
    // able to find them from results[0].
    for (var x = 0, length_1 = results.length; x < length_1; x++){
      for (var y = 0, length_2 = results[x].address_components.length; y < length_2; y++){
        var type = results[x].address_components[y].types[0];
        if (type === 'locality'){
          city = results[x].address_components[y].long_name;
          if (country !== 'Unknown') {
            break;
          }
        } else if (type === 'country') {
          country = results[x].address_components[y].long_name;
          if (city !== 'Unknown') {
            break;
          }
        }
      }
      if (city !== 'Unknown' && country !== 'Unknown') {
        break;
      }
    }
    if (city === 'Unknown' || country === 'Unknown') {
      // according to Google map docs, results[4].formatted_address should provide
      // a relatively coarse address, for example, 'Stuttgart, Germany'.
      city = results[4].formatted_address;
    } else {
      city = city + ', ' + country;
    }
    return city;
  };

  // Callback after successful call to acquire current coordinates
  this.geolocationComplete = function(position, self, callback) {
    var geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    self.currentLocation.latitude = position.coords.latitude;
    self.currentLocation.longitude = position.coords.longitude;
    geocoder.geocode({ 'latLng': latlng }, function(results, status) {
      self.currentLocation.city = self.findClosestCity(results);
      self.currentLocation.initialized = true;
      self.currentLocation.available = true;
      console.log('GeoService: new location coordinates: ' + JSON.stringify(self.currentLocation));
      callback(self.currentLocation, false);
    });
  };

  // Callback after failed attempt to acquire current coordinates
  this.geolocationError = function(error, self, callback) {
    console.log('GeoService: Google geolocation.getCurrentPosition() error: ' + error.code + ', ' + error.message);
    self.currentLocation.initialized = true;
    self.currentLocation.available = false;
    callback(self.currentLocation, false);
  };

  // Main function provided by service - return the current location
  // if geo location services are available.
  // The callback will also return a second parameter, specifying if a
  // digest round is currently in progress (i.e. whether they need to call
  // $scope.apply() in their callback handler or not).
  this.getCurrentLocation = function (callback) {
    // Initialize if needed
    if (this.currentLocation.initialized === true) {
      callback(this.currentLocation, true);
    } else if (navigator.geolocation) {
      var self = this;
      navigator.geolocation.getCurrentPosition(function(position) {
        self.geolocationComplete(position, self, callback);
      },
      function errorCallback(error) {
        self.geolocationError(error, self, callback);
      },
        {
          // Note: Do NOT specify maximumAge to re-use previously-cached locations, since
          // that causes 'google not defined' errors when re-loading pages.
          timeout:10000        // 10-second timeout
        }
      );
    } else {
      this.currentLocation.initialized = true;
      this.currentLocation.available = false;
      console.log('GeoService: navigator.geolocation service not available.');
      callback(this.currentLocation, true);
    }
  };

  // This method is the falback-method in case geo-location services are
  // not available, or the user does not want to use them.  The resulting
  // city list with coordinates will be returned as an array, where each
  // entry in the array has fields:
  // name: 'cityName'
  // lat: Numeric latitude for city
  // lng: Numeric longitude for city
  // The callback will also return a second parameter, specifying if a
  // digest round is currently in progress (i.e. whether they need to call
  // $scope.apply() in their callback handler or not).
  this.getCityList = function($http, callback) {
    if (this.cityListCached) {
      callback(this.cityList, true);
    } else {
      var basicCities = [
        { 'name': 'Berlin', 'lat': 52.524, 'lng': 13.411 },
        { 'name': 'Bremen', 'lat': 53.075, 'lng': 8.808 },
        { 'name': 'Dortmund', 'lat': 51.515, 'lng': 7.466 },
        { 'name': 'Dusseldorf', 'lat': 51.222, 'lng': 6.776 },
        { 'name': 'Essen', 'lat': 51.457, 'lng': 7.012 },
        { 'name': 'Frankfurt am Main', 'lat': 50.116, 'lng': 8.684 },
        { 'name': 'Hamburg', 'lat': 53.575, 'lng': 10.015 },
        { 'name': 'Köln', 'lat': 50.933, 'lng': 6.95 },
        { 'name': 'München', 'lat': 48.137, 'lng': 11.575 },
        { 'name': 'Stuttgart', 'lat': 48.782, 'lng': 9.177 }
      ];
      var self = this;
      $http({
        method: 'GET',
        url: 'geo/de_cities'
      }).then(function successCallback(response) {
        /*jshint evil:true */
        // Note - the above jshint directive allows us to use the 'eval' function below,
        // to transform the data received directly into an array of JSON city objects.
        console.log('GeoService: Loaded city list from \'public/geo/de_cities\' with status ' + response.status);
        try {
          // expected format: [{"name":"Aachen","lat":50.77664,"lng":6.08342},{"name":"Aalen" ... }]
          // cache the resulting city list to avoid future GET requests in this session
          self.cityList = eval(response.data);
          self.cityListCached = true;
          callback(self.cityList, true);
        } catch(e) {
          console.log('GeoService: Error parsing city list in \'public/geo/de_cities\', using hard-coded 10 largest cities.  Exception: ' + e);
          callback(basicCities, true);
        }
      }, function errorCallback(response) {
        console.log('GeoService: Error \'' + response.status + '\' loading city list in \'public/geo/de_cities\', using hard-coded 10 largest cities.');
        callback(basicCities, true);
      });
    }
  };

  // For unit tests, setup fake/sample cached geo-location data
  this.setupTestEnvironment = function() {
    console.log('GeoService: Creating test environment.');
    var testCities = [ { 'name': 'Stuttgart', 'lat': 48.782, 'lng': 9.177 } ];
    this.cityListCached = true;
    this.cityList = testCities;
    this.currentLocation.initialized = true;
    this.currentLocation.available = false;
  };
}
]);

