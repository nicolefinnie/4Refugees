'use strict';

/**
 * GeoLocator global service to determine current geo coordinates.
 * 
 * To use this global service, make sure to include GeoLocator in your controller.
 * 
 * To query your current coordinates, use the following code in your controller:
 * 
 * @code 
  angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                                     'Authentication', 'Offerings', 'GeoLocator',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, GeoLocator) {

    GeoLocator.getCurrentLocation(function(myLocation, digestInProgress) {
      if (myLocation.available) {
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
    longitude: 0,       // current longitude
    latitude: 0         // current latitude
  };

  // Main function provided by service - return the current location
  // if geo location services are available.
  // The callback will also return a second parameter, specifying if a
  // digest round is currently in progress (i.e. whether they need to call
  // $scope.apply() in their callback handler or not).
  this.getCurrentLocation = function (callback) {

    if (navigator.geolocation === undefined) {
      this.currentLocation.initialized = true;
      this.currentLocation.available = false;
      console.log('GeoLocator: Location services are not available.');
    } 

    if (this.currentLocation.initialized === true) {
      callback(this.currentLocation, true);
    } else {
      var self = this;
      navigator.geolocation.getCurrentPosition(function(position) {
        self.currentLocation.initialized = true;
        self.currentLocation.available = true;
        self.currentLocation.latitude = position.coords.latitude;
        self.currentLocation.longitude = position.coords.longitude;
        console.log('GeoLocator: New location coordinates: ' + JSON.stringify(self.currentLocation));
        callback(self.currentLocation, false);
      },
      function errorCallback(error) {
        self.currentLocation.initialized = true;
        self.currentLocation.available = false;
        console.log('GeoLocator: Location services not available, error: ' + error.code + ', ' + error.message);
        callback(self.currentLocation, false);
      },
        {
          // Note: Do NOT specify maximumAge to re-use previously-cached locations, since
          // that causes 'google not defined' errors when re-loading pages.
          timeout:10000        // 10-second timeout
        }
      );
    }
  };

  // For unit tests, setup fake/sample cached geo-location data
  this.setupTestEnvironment = function() {
    this.currentLocation.initialized = true;
    this.currentLocation.available = true;
    this.currentLocation.longitude = Number(9.177);
    this.currentLocation.latitude = Number(48.782);
  };
}
]);


/**
 * GeoReverseLookup global service to find an address from coordinates.
 * 
 * To use this global service, make sure to include GeoReverseLookup in your controller.
 * 
 * To query your current address, use the following code in your controller:
 * 
 * @code 
  angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                                     'Authentication', 'Offerings', 'GeoLocator', 'GeoReverseCoder',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, GeoLocator, GeoReverseCoder) {

    GeoReverseCoder.getAddress(myLocation, function(address, digestInProgress) {
      if (address.available) {
        // Yeah, I can use address.city, address.region, address.country!!!
      }
    });
  }];
 * @endcode
 * 
 * The APIs currently offered are:
 * 
 * getAddress(coordinates, callback(address, digestInProgress)); 
 * setupTestEnvironment(); // fake support for unit tests
 * 
 **/
angular.module('geo').service('GeoReverseCoder', [ 'GeoLocator',
function (GeoLocator) {

  // Define the current location object
  this.address = {
    initialized: false, // internal-use only
    available: false,   // reverse geocoding services are available
    city: '',           // nearest city to our current location
    region: '',         // region/province/state of current location
    country: '',        // country of current location
    longitude: 0,       // provided longitude for reverse lookup
    latitude: 0         // provided latitude for reverse lookup
  };

  this.findClosest = function (findType, results) {
    // Search through the returned results to find the location at the granularity
    // requested by the caller. In general, the returned 'results' start from the
    // most specific address, to the most general, so start with the most specific.
    for (var x = 0, length_1 = results.length; x < length_1; x++){
      for (var y = 0, length_2 = results[x].address_components.length; y < length_2; y++){
        var type = results[x].address_components[y].types[0];
        if (type === findType) {
          return results[x].address_components[y].long_name;
        }
      }
    }
    return 'Unknown';
  };

  this.cachedLocationValid = function(coordinates) {
    return (this.address.initialized && coordinates && (this.address.longitude === coordinates.longitude) && (this.address.latitude === coordinates.latitude));
  };

  this.doReverseGeocode = function(self, callback) {
    // Note: Other reverse-geocoding providers besides Google could be used
    // as well, for example, OpenStreetMap has the Nominatim service:
    // http://wiki.openstreetmap.org/wiki/Nominatim#Reverse_Geocoding
    var geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(self.address.latitude, self.address.longitude);
    geocoder.geocode({ 'latLng': latlng }, function(results, status) {
      self.address.initialized = true;
      self.address.available = (status === google.maps.GeocoderStatus.OK);
      if (self.address.available) {
        self.address.city = self.findClosest('locality', results);
        self.address.country = self.findClosest('country', results);
        self.address.region = self.findClosest('administrative_area_level_1', results);
        console.log('GeoReverseCoder: new address information: ' + JSON.stringify(self.address));
      } else {
        console.log('GeoReverseCoder: service not available, status: ' + status);
      }
      callback(self.address, false);
    });
  };

  // Main function provided by service - do a reverse geocoding lookup for
  // the specified location (or current location, if none specified).
  // The callback will return the current translated address, if possible, and
  // also return a second parameter, specifying if a digest round is currently
  // in progress (i.e. whether they need to call $scope.apply() in their
  // callback handler or not).
  this.getAddress = function (coordinates, callback) {
    if (this.cachedLocationValid(coordinates)) {
      callback(this.address, true);
    } else {
      var self = this;
      if (coordinates && coordinates.latitude && coordinates.longitude) {
        self.address.latitude = coordinates.latitude;
        self.address.longitude = coordinates.longitude;
        self.doReverseGeocode(self, callback);
      } else {
        // No coordinates provided, lookup current location, and get address of that
        GeoLocator.getCurrentLocation(function(myLocation, digestInProgress) {
          if (myLocation.available) {
            self.address.latitude = myLocation.latitude;
            self.address.longitude = myLocation.longitude;
            self.doReverseGeocode(self, callback);
          } else {
            self.address.initialized = true;
            self.address.available = false;
            callback(self.address, false);
          }
        });
      }
    }
  };

  // For unit tests, setup fake/sample cached geo-location data
  this.setupTestEnvironment = function() {
    this.address.initialized = true;
    this.address.available = true;
    this.address.city = 'Stuttgart';
    this.address.region = 'Baden Württemberg';
    this.address.country = 'Germany';
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
angular.module('geo').service('GeoSelector', ['GeoLocator', 'GeoReverseCoder', 'GeoList',
function (GeoLocator, GeoReverseCoder, GeoList) {

  //Initializes and return a common geo json useful for controllers
  this.getInitialState = function (selections) {
    var geo = {
      'auto' : {
        'supported'           : selections.enableLocator,
        'reverseGeocoder'     : selections.enableReverseGeocoder,
        'initText'            : '...',
        'successText'         : '...',
        'initialized'         : false,
        'active'              : false,
        'location'            : {}
      },
      'list' : {
        'supported'   : selections.enableList,
        'initialized' : false,
        'active'      : false,
        'data'        : [],
        'location'    : {}
      },
      'manual' : {
        'supported'   : selections.enableManual,
        'initialized' : false,
        'active'      : false,
        'location'    : {}
      }
    };
    return geo;
  };

  // Allow caller to update default init/success text, for GeoLocator support.
  // Used, for example, if the language has changed.
  this.updateAutoTextResults = function(geo, initText, successText) {
    geo.auto.initText = initText;
    geo.auto.successText = successText;
    if (!geo.auto.initialized) {
      geo.auto.location.city = geo.auto.initText;
      geo.auto.location.region = geo.auto.initText;
      geo.auto.location.country = geo.auto.initText;
    } else if (geo.auto.supported && !geo.auto.reverseGeocoder) {
      geo.auto.location.city = geo.auto.successText;
      geo.auto.location.region = geo.auto.successText;
      geo.auto.location.country = geo.auto.successText;
    }
  };

  this.activateLocator = function(geo, initText, successText, needDigestCallback) {
    geo.auto.active = true;
    geo.list.active = false;
    geo.manual.active = false;
    if (!geo.auto.initialized) {
      geo.auto.initText = initText;
      geo.auto.successText = successText;
      geo.auto.location.city = geo.auto.initText;
      geo.auto.location.region = geo.auto.initText;
      geo.auto.location.country = geo.auto.initText;
      if (geo.auto.reverseGeocoder) {
        GeoReverseCoder.getAddress(null, function(myAddress, digestInProgress) {
          geo.auto.supported = myAddress.available;
          geo.auto.initialized = true;
          if (geo.auto.supported) {
            geo.auto.location.lat = myAddress.latitude;
            geo.auto.location.lng = myAddress.longitude;
            geo.auto.location.city = myAddress.city;
            geo.auto.location.region = myAddress.region;
            geo.auto.location.country = myAddress.country;
          }
          if (!geo.auto.supported || !digestInProgress) {
            needDigestCallback();
          }
        });
      } else {
        GeoLocator.getCurrentLocation(function(myLocation, digestInProgress) {
          geo.auto.supported = myLocation.available;
          geo.auto.initialized = true;
          if (geo.auto.supported) {
            geo.auto.location.lat = myLocation.latitude;
            geo.auto.location.lng = myLocation.longitude;
            geo.auto.location.city = geo.auto.successText;
            geo.auto.location.region = geo.auto.successText;
            geo.auto.location.country = geo.auto.successText;
          }
          if (!geo.auto.supported || !digestInProgress) {
            needDigestCallback();
          }
        });
      }
    }
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
    if (!geo.list.initialized) {
      GeoList.getCityList($http, function(cityList) {
        geo.list.data = cityList;
        geo.list.initialized = true;
      });
    }
  };

  // Make the next supported geo option the active one
  this.toggleActive = function(geo, $http, needDigestCallback) {
    if (geo.auto.active) {
      if (geo.list.supported) {
        this.activateCityList(geo, $http);
      } else if (geo.manual.supported && geo.manual.initialized) {
        geo.manual.active = true;
        geo.auto.active = false;
      } // else, no other options, leave auto active
    } else if (geo.list.active) {
      if (geo.manual.supported && geo.manual.initialized) {
        geo.manual.active = true;
        geo.list.active = false;
      } else if (geo.auto.supported) {
        this.activateLocator(geo, '...', '...', needDigestCallback);
      } // else, no other options, leave list active
    } else {
      if (geo.auto.supported) {
        this.activateLocator(geo, '...', '...', needDigestCallback);
      } else if (geo.list.supported) {
        this.activateCityList(geo, $http);
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

