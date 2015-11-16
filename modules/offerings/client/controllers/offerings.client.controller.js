'use strict';

// TODO: Rename/improve this method
function numOfferType(ot) {
  if (ot === true) {
    return 1;
  }
  return 0;
}

// Converts the category selections from the input form into an
// array of category strings
function getCategoryArray(cat, defaultSetting) {
  if (cat && cat.length !== 0) {
    return Object.keys(cat);
  } else {
    return [defaultSetting];
  }
}
              
// Offerings controller available for un-authenticated users
angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $stateParams, $location, Authentication, Offerings, Socket) {
    $scope.authentication = Authentication;
    
      // get current geo location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          var geocoder = new google.maps.Geocoder();
          var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          $scope.latitude = position.coords.latitude;
          $scope.longitude = position.coords.longitude;
          
          geocoder.geocode({
            'latLng': latlng
          }, function(results, status) {
            $scope.city = results[4].formatted_address;
            $scope.$apply();
          });
        });
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
            // mapping boolean offerType from slider on webpage to integer 0 and 1
        offerType: numOfferType(this.offerType) 
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

//Offerings controller only available for authenticated users
angular.module('offerings').controller('OfferingsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $stateParams, $location, Authentication, Offerings, Socket) {
    $scope.authentication = Authentication;
    
      // get current geo location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          var geocoder = new google.maps.Geocoder();
          var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          $scope.latitude = position.coords.latitude;
          $scope.longitude = position.coords.longitude;
          
          geocoder.geocode({
            'latLng': latlng
          }, function(results, status) {
            $scope.city = results[4].formatted_address;
            $scope.$apply();
          });
        });
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
            // mapping boolean offerType from slider on webpage to integer 0 and 1
        offerType: numOfferType(this.offerType) 
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
      // TODO: Pass in currently-authenticated user to restrict search
      $scope.offerings = Offerings.query();
    };

  }
]);
