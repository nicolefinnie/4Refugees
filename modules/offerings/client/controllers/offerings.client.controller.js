'use strict';


// Offerings controller
angular.module('offerings').controller('OfferingsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $stateParams, $location, Authentication, Offerings, Socket) {
    $scope.authentication = Authentication;

    // TODO: Need to include the googleapis javascript in some .html file somehow, before
    // the google.maps APIs will work....  the following link needs to be added, but where???
    // <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?sensor=false"></script>
//    if (navigator.geolocation) {
//      navigator.geolocation.getCurrentPosition(
//        function(position) {
//        var geocoder = new google.maps.Geocoder();
//        var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
//        $scope.lat = position.coords.latitude;
//        $scope.lng = position.coords.longitude;
//        geocoder.geocode({
//          'latLng': latlng
//        }, function(results, status) {
//          $scope.city = results[4].formatted_address;
//          $scope.$apply();
//          $("input[name='location']").focus();$("input[name='location']").blur();
//        });
//      });
//    }

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
        category: this.category,
        longitude: this.longitude,
        latitude: this.latitude,
        offerType: this.offerType
      });

      // Create a new message object for any new offering
      var msgtext = 'new offering.category ';
      if (offering.offerType === 0) msgtext = msgtext + ' offering in ';
      else msgtext = msgtext + 'request in ';
      msgtext = msgtext + offering.city + ' at ' + JSON.stringify(offering.when);

      var message = {
        text: msgtext
      };

      // Emit a 'chatMessage' message event
      Socket.emit('chatMessage', message);

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

    // Create new Offering
    $scope.searchAll = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringForm');
        return false;
      }

      // Create new Offering object
      var searchOfferings = new Offerings({
        when: this.when,
        updated: Date.now,
        description: this.description,
        city: this.city,
        category: this.category,
        longitude: this.longitude,
        latitude: this.latitude,
        radius: this.radius,
        offerType: this.offerType
      });

      // Use $update to send json search using PUT request
      searchOfferings.$update(function (response) {
        // Search results arrive as a single json doc, and 'searchResults'
        // field contains the search payload - an array of matching offerings.
        var arrayResultsOuter = response.searchResults;
        var arrayResults = [];
        arrayResultsOuter.forEach(function(result) {
          // The offering's distance is returned separately, so add it to output json.
          result.obj.distance = result.dis;
          // TODO: Search result should return offering originator's user displayName (*NOT* email)?
          result.obj.displayName = 'Need_to_find_originating_use';
          arrayResults.push(result.obj);
        });

        // TODO: Should we re-direct to another page to display results?  If so, how?
        $scope.offerings = arrayResults;
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
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
