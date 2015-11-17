'use strict';

//TODO we need a language translation map in another file that maps text variables to context, e.g. $scope.showTitle = 'Suchen' in German and 'Search' in English

// Converts the category selections from the input form into an
// array of category strings
function getCategoryArray(cat, defaultSetting) {
  if (cat && cat.length !== 0) {
    return Object.keys(cat);
  } else {
    return [defaultSetting];
  }
}
   
function geoUpdateLocation(position, scope) {
  var geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
  scope.latitude = position.coords.latitude;
  scope.longitude = position.coords.longitude;

  geocoder.geocode({ 'latLng': latlng }, function(results, status) {
    var city = 'Unknown';
    var country = 'Unknown';
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
      scope.city = results[4].formatted_address;
    } else {
      scope.city = city + ', ' + country;
    }
    scope.$apply();
  });
}

function geoUpdateLocationError(error, scope) {
  console.log('Google geolocation.getCurrentPosition() error: ' + error.code + ', ' + error.message);
  scope.city = 'Google geo error, try again later.';
  scope.$apply();
}

// Offerings controller available for un-authenticated users
angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $stateParams, $location, Authentication, Offerings, Socket) {
    $scope.authentication = Authentication;
    
    // determine offer type 
    $scope.offerType = $location.search().offerType;
    
    //Volunteer mode: determine the title to show, this mode search needs or create offer
    if ($scope.offerType === 'request') {
      $scope.showTitle = 'Search needs';
      $scope.createOffer = !$scope.createOffer;
    
    // Refugee mode: determine the title to show, this mode search help OR create request
    } else if ($scope.offerType === 'offer'){
      $scope.showTitle = 'Find help';
      $scope.createRequest = !$scope.createRequest;
    }

    // get current location using Google GeoLocation services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        geoUpdateLocation(position, $scope);
      },
      function errorCallback(error) {
        geoUpdateLocationError(error, $scope);
      },
        {
          // Note: Do NOT specify maximumAge to re-use previously-cached locations, since
          // that causes 'google not defined' errors when re-loading pages.
          timeout:10000        // 10-second timeout
        }
      );
    }

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    $scope.messages = [];

    // Search all offerings for the input criteria
    $scope.searchAll = function (isValid) {
        
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringFormSearch');
        return false;
      }

      // TODO: Should we re-direct to a new page? or render a new page?
      $scope.offerings = Offerings.query({
        description: this.description,
        city: this.city,
        longitude: this.longitude,
        latitude: this.latitude,
        radius: this.radius? this.radius:10,
        when: this.when,
             // mapping JSON array category from checkbox on webpage to String
        category: getCategoryArray(this.category, ''),
        offerType: this.offerType 
      });
    };

    // Find existing Offering
    $scope.findOne = function () {
      $scope.offering = Offerings.get({
        offeringId: $stateParams.offeringId
      });
    };

  }
]);

//Edit controller only available for authenticated users
angular.module('offerings').controller('OfferingsEditController', ['$scope', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $stateParams, $location, Authentication, Offerings, Socket) {
    
    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    $scope.messages = [];
    $scope.category = {};
    
    $scope.authentication = Authentication;
 
    // get current location using Google GeoLocation services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        geoUpdateLocation(position, $scope);
      },
      function errorCallback(error) {
        geoUpdateLocationError(error, $scope);
      },
        {
          // Note: Do NOT specify maximumAge to re-use previously-cached locations, since
          // that causes 'google not defined' errors when re-loading pages.
          timeout:10000        // 10-second timeout
        }
      );
    }

    // Update existing Offering
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringForm');
        return false;
      }

      var offering = $scope.offering;

      offering.$update(function () {
        $location.path('offerings/' + offering._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    
    // Find existing Offering
    $scope.findOne = function () {
      $scope.offering = Offerings.get({ 
        offeringId: $stateParams.offeringId 
      }, function () {
        //determine if it's edit request or offer
        if ($scope.offering.offerType === 0){
          $scope.showTitle = 'Edit Offer';
        } else {
          $scope.showTitle = 'Edit Request';
        }
       
        // set selected category checkbox of the to-edit-request/offer 
        var selectedCategory = {};
        $scope.offering.category.forEach(function(eachCategory) {
          selectedCategory[eachCategory] = true;
        });
        $scope.category = selectedCategory;
      });
    };

  }
]);

//Offerings controller only available for authenticated users
angular.module('offerings').controller('OfferingsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $stateParams, $location, Authentication, Offerings, Socket) {
    $scope.authentication = Authentication;
    
    // determine offer type 
    $scope.offerType = $location.search().offerType;
    
    // Refugee mode: determine the title to show, this mode create request OR search offer
    if ($scope.offerType === 'request') {
      $scope.showTitle = 'Need help';
      $scope.searchOffer = !$scope.searchOffer;
     
    // volunteer mode: determine the title to show, this mode create offer OR search request
    } else if ($scope.offerType === 'offer'){
      $scope.showTitle = 'Offer help';
      $scope.searchRequest = !$scope.searchRequest;
    }

    // get current location using Google GeoLocation services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        geoUpdateLocation(position, $scope);
      },
      function errorCallback(error) {
        geoUpdateLocationError(error, $scope);
      },
        {
          // Note: Do NOT specify maximumAge to re-use previously-cached locations, since
          // that causes 'google not defined' errors when re-loading pages.
          timeout:10000        // 10-second timeout
        }
      );
    }

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    $scope.messages = [];

    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    // Create new Offering
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringForm');

        return false;
      }

      // Create new Offering object
      var offering = new Offerings({
        when: this.when,
        updated: Date.now,
        description: this.description,
        city: this.city,
             // mapping JSON array category from checkbox on webpage to String
        category: getCategoryArray(this.category, 'Other'),
        longitude: $scope.longitude,
        latitude: $scope.latitude,
        offerType: this.offerType 
      });
      
      // Emit a 'offeringMessage' message event with the JSON offering object
      var message = {
        content: offering
      };
      Socket.emit('offeringMessage', message);

      // Redirect after save
      offering.$save(function (response) {
        $location.path('offerings/' + response._id);

        // Clear form fields
        $scope.when = '';
        $scope.updated = '';
        $scope.description = '';
        $scope.city = '';
        $scope.category = '';
        $scope.longitude = '';
        $scope.latitude = '';
        $scope.offerType = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Offering
    $scope.remove = function (offering) {
      if (offering) {
        offering.$remove();

        for (var i in $scope.offerings) {
          if ($scope.offerings[i] === offering) {
            $scope.offerings.splice(i, 1);
          }
        }
      } else {
        $scope.offering.$remove(function () {
          $location.path('offerings');
        });
      }
    };

    // Update existing Offering
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringForm');
        return false;
      }

      var offering = $scope.offering;

      offering.$update(function () {
        $location.path('offerings/' + offering._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Offerings
    $scope.find = function () {
      $scope.offerings = Offerings.query();
    };

    // Find existing Offering
    $scope.findOne = function () {
      $scope.offering = Offerings.get({
        offeringId: $stateParams.offeringId
      });
    };
  }
]);
