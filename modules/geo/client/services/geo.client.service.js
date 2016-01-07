'use strict';

/**
 * GeoLocator global service to determine current geo location.
 * 
 * To use this global service, make sure to include GeoLocator in your controller.
 * 
 * To query your current location coordinates, use the following code in your controller:
 * 
 * @code 
  angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                                     'Authentication', 'Offerings', 'GeoLocator',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, GeoLocator) {

    GeoLocator.getCurrentLocation(function(myLocation, digestInProgress) {
      if (myLocation.available) {
        $scope.city = myLocation.city;
        $scope.latitude = myLocation.latitude;
        $scope.longitude = myLocation.longitude;
      } else {
        console.log('Uh oh, geo location service is not available.');
      }
    });
  }];
 * @endcode
 * 
 * The APIs currently offered are:
 * 
 * getCurrentLocation(callback(myLocation, digestInProgress)); 
 * setupTestEnvironment(); // fake support for unit tests
 * 
 **/
angular.module('geo').service('GeoLocator', [ function () {

  // Define the current location object
  // TODO: Add a date when this location was initialized, refresh periodically
  this.currentLocation = {
    initialized: false, // internal-use only
    available: false,   // geo-location services determined location properly
    city: '',           // nearest city to our current location
    longitude: '',      // current longitude
    latitude: ''        // current latitude
  };

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
      console.log('GeoLocator: new location coordinates: ' + JSON.stringify(self.currentLocation));
      callback(self.currentLocation, false);
    });
  };

  // Callback after failed attempt to acquire current coordinates
  this.geolocationError = function(error, self, callback) {
    console.log('GeoLocator: Google geolocation.getCurrentPosition() error: ' + error.code + ', ' + error.message);
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
      console.log('GeoLocator: navigator.geolocation service not available.');
      callback(this.currentLocation, true);
    }
  };

  // For unit tests, setup fake/sample cached geo-location data
  this.setupTestEnvironment = function() {
    this.currentLocation.initialized = true;
    this.currentLocation.available = true;
    this.currentLocation.city = 'Stuttgart';
    this.currentLocation.longitude = Number(9.177);
    this.currentLocation.latitude = Number(48.782);
  };
}
]);


/**
 * Global geo service to provide a list of geographical locations users can choose from.
 * 
 * To use this global service, make sure to include GeoList in your controller.
 * 
 * @code 
  angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                                     'Authentication', 'Offerings', 'GeoList',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, GeoList) {

    GeoList.getCityList($http, function(cityList) {
      $scope.citylist = cityList;
    });
  }];
 * @endcode
 * 
 * The APIs currently offered are:
 * getCityList($http, callback(cityList));
 * setupTestEnvironment(); // fake support for unit tests
 * 
 **/
angular.module('geo').service('GeoList', [ function () {

  this.cityList = [{}];
  this.cityListCached = false;
  // TODO: Provide a regionList/regionListCached for region list support

  // Retrieves a predetermined array of cities the user can select from.
  // Each JSON entry in the array has the following fields:
  // city: 'cityName'
  // lat: Numeric latitude for city
  // lng: Numeric longitude for city
  this.getCityList = function($http, callback) {
    if (this.cityListCached) {
      callback(this.cityList);
    } else {
      var basicCities = [
        { 'city': 'Berlin', 'lat': 52.524, 'lng': 13.411 },
        { 'city': 'Bremen', 'lat': 53.075, 'lng': 8.808 },
        { 'city': 'Dortmund', 'lat': 51.515, 'lng': 7.466 },
        { 'city': 'Dusseldorf', 'lat': 51.222, 'lng': 6.776 },
        { 'city': 'Essen', 'lat': 51.457, 'lng': 7.012 },
        { 'city': 'Frankfurt am Main', 'lat': 50.116, 'lng': 8.684 },
        { 'city': 'Hamburg', 'lat': 53.575, 'lng': 10.015 },
        { 'city': 'Köln', 'lat': 50.933, 'lng': 6.95 },
        { 'city': 'München', 'lat': 48.137, 'lng': 11.575 },
        { 'city': 'Stuttgart', 'lat': 48.782, 'lng': 9.177 }
      ];
      var self = this;
      var cityUrl = 'geo/de_cities';
      var publicCityUrl = '\'public/' + cityUrl + '\'';
      $http({
        method: 'GET',
        url: cityUrl
      }).then(function successCallback(response) {
        console.log('GeoList: Loaded city list from ' + publicCityUrl + ' with status ' + response.status);
        try {
          // expected format: [{"city":"Aachen","lat":50.77664,"lng":6.08342},{"city":"Aalen" ... }]
          // cache the resulting city list to avoid future GET requests in this session
          self.cityList = response.data;
          self.cityListCached = true;
          callback(self.cityList);
        } catch(e) {
          console.log('GeoList: Error parsing city list in ' + publicCityUrl + ', using hard-coded 10 largest cities.  Exception: ' + e);
          callback(basicCities);
        }
      }, function errorCallback(response) {
        console.log('GeoList: Error \'' + response.status + '\' loading city list in ' + publicCityUrl + ', using hard-coded 10 largest cities.');
        callback(basicCities);
      });
    }
  };

  // For unit tests, setup fake/sample cached geo-location data
  this.setupTestEnvironment = function() {
    var testCities = [ { 'name': 'Stuttgart', 'lat': 48.782, 'lng': 9.177 } ];
    this.cityListCached = true;
    this.cityList = testCities;
  };

}
]);


/**
 * The GeoSelector global geo service encapsulates multiple geo location sources,
 * allowing the caller to toggle between which location source to use.  Three
 * sources are currently provided:
 *  - auto, looks up the current location using the GeoLocator service
 *  - list, looks up a pre-configured city list using the GeoList service
 *  - manual, caller passes in a hard-coded location
 * 
 * The caller can decide which of the sources to activate by default, and each
 * toggleActive() service call will select the next available source in the list.
 * 
 * For example, to query your current location coordinates and fall-back on letting
 * the user select a city from a list if Google maps geo-location services are not
 * available, use the following code in your controller:
 * 
 * @code 
  angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                                     'Authentication', 'Offerings', 'GeoSelector',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, GeoSelector) {

    $scope.geo = GeoSelector.getInitialState(true, true, false);
    GeoSelector.activateLocator($scope.geo, 'loading...', function() {
      // only called if geo location failed, or if the location was returned
      // asynchronously and a digest round is required
      if (!$scope.geo.auto.supported) {
        GeoSelector.toggleActive($scope.geo, $http);
      } else {
        $scope.$apply();
      }
    });
  }];
 * @endcode
 * 
 * The APIs currently offered are:
 * 
 * geo = getInitialState(enableLocator, enableList, enableManual);
 * activateLocator(geo, initText, needDigestCallback);
 * activateManual(geo, manualLocation);
 * activateCityList(geo, $http);
 * toggleActive(geo, $http, needDigestCallback);
 * getActivateLocation(geo);
 * //fake geolocation support for unit tests
 * setupTestEnvironment();
 * 
 **/
angular.module('geo').service('GeoSelector', ['GeoLocator', 'GeoList',
function (GeoLocator, GeoList) {

  //Initializes and return a common geo json useful for controllers
  this.getInitialState = function (enableLocator, enableList, enableManual) {
    var geo = {
      'auto' : {
        'supported'   : enableLocator,
        'initialized' : false,
        'active'      : false,
        'initialCity' : '',
        'location'    : {}
      },
      'list' : {
        'supported'   : enableList,
        'initialized' : false,
        'active'      : false,
        'data'        : [],
        'location'    : {}
      },
      'manual' : {
        'supported'   : enableManual,
        'initialized' : false,
        'active'      : false,
        'location'    : {}
      }
    };
    return geo;
  };

  this.activateLocator = function(geo, initText, needDigestCallback) {
    geo.auto.active = true;
    geo.list.active = false;
    geo.manual.active = false;
    geo.auto.location.city = initText;
    GeoLocator.getCurrentLocation(function(myLocation, digestInProgress) {
      geo.auto.supported = myLocation.available;
      geo.auto.initialized = true;
      if (geo.auto.supported) {
        geo.auto.location.city = myLocation.city;
        geo.auto.location.lat = myLocation.latitude;
        geo.auto.location.lng = myLocation.longitude;
      }
      if (!digestInProgress || !geo.auto.supported) {
        needDigestCallback();
      }
    });
  };

  this.activateManual = function(geo, manualLocation) {
    geo.manual.location = manualLocation;
    geo.manual.initialized = true;
    geo.manual.active = true;
    geo.auto.active = false;
    geo.list.active = false;
  };

  this.activateCityList = function(geo, $http) {
    geo.list.active = true;
    geo.auto.active = false;
    geo.manual.active = false;
    GeoList.getCityList($http, function(cityList) {
      geo.list.data = cityList;
      geo.list.initialized = true;
    });
  };

  // Make the next supported geo option the active one
  this.toggleActive = function(geo, $http, needDigestCallback) {
    if (geo.auto.active) {
      if (geo.list.supported) {
        if (geo.list.initialized) {
          geo.list.active = true;
          geo.auto.active = false;
        } else {
          this.activateCityList(geo, $http); // clears geo.auto.active on success
        }
      } else if (geo.manual.supported && geo.manual.initialized) {
        geo.manual.active = true;
        geo.auto.active = false;
      } // else, no other options, leave auto active
    } else if (geo.list.active) {
      if (geo.manual.supported && geo.manual.initialized) {
        geo.manual.active = true;
        geo.list.active = false;
      } else if (geo.auto.supported) {
        if (geo.auto.initialized) {
          geo.auto.active = true;
          geo.list.active = false;
        } else {
          this.activateLocator(geo, '...', needDigestCallback);
        }
      } // else, no other options, leave list active
    } else {
      if (geo.auto.supported) {
        if (geo.auto.initialized) {
          geo.auto.active = true;
          geo.manual.active = false;
        } else {
          this.activateLocator(geo, '...', needDigestCallback);
        }
      } else if (geo.list.supported) {
        if (geo.list.initialized) {
          geo.list.active = true;
          geo.manual.active = false;
        } else {
          this.activateCityList(geo, $http); // clears geo.manual.active on success
        }
      } // else, no other options, leave manual active
    }
  };

  // Return the currently selected geo location
  this.getActiveLocation = function(geo) {
    var geoSelection;
    if (geo.auto.active) {
      geoSelection = geo.auto.location;
    } else if (geo.list.active) {
      geoSelection = geo.list.location;
    } else {
      geoSelection = geo.manual.location;
    }
    geoSelection.isInvalid = (geoSelection.city === undefined || geoSelection.lng === undefined || geoSelection.lat === undefined);
    return geoSelection;
  };

  // For unit tests, setup fake/sample cached geo-location data
  this.setupTestEnvironment = function() {
    var geo = this.getInitialState(false, false, true);
    var testLocation = { 'city': 'Stuttgart', 'lat': 48.782, 'lng': 9.177 };
    this.activateManual(geo, testLocation);
    return geo;
  };
}
]);

