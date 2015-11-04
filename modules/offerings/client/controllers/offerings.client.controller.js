'use strict';


// Offerings controller
angular.module('offerings').controller('OfferingsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Offerings',
  function ($scope, $stateParams, $location, Authentication, Offerings) {
    $scope.authentication = Authentication;

    // Note - need to include the googleapis javascript in some .html file somehow, before
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
