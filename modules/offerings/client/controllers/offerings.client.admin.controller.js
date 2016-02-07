'use strict';

// Offerings controller only available for admins
angular.module('offerings').controller('OfferingsAdminController', ['$scope', '$filter', '$http', '$stateParams', '$location', 'Authentication', 'LanguageService', 'Offerings',
  function ($scope, $filter, $http, $stateParams, $location, Authentication, LanguageService, Offerings) {
    $scope.authentication = Authentication;

    $scope.buildPager = function () {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
      $scope.pagination = {
        current: 1
      };
    };

    $scope.figureOutItemsToDisplay = function () {
      $scope.filteredItems = $filter('filter')($scope.offerings, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function () {
      $scope.figureOutItemsToDisplay();
    };

    // Not sure what this is for????
    $scope.pageChangeHandler = function(num) {
      console.log('meals page changed to ' + num);
    };

    // Remove single Offering
    $scope.removeSingleOffering = function (offering) {
      offering.$remove(function () {
        console.log('Offering: Admin: completed remove request.');
      });
    };

    // Remove one offering from within list of all offerings
    $scope.removeOfferingFromList = function (offering) {
      offering.$remove();
      for (var i in $scope.offerings) {
        if ($scope.offerings[i] === offering) {
          $scope.offerings.splice(i, 1);
        }
      }
    };

    // Send an admin request to the server
    $scope.sendAdminRequest = function (adminRequestType) {
      $scope.offerings = Offerings.query({
        adminRequest: adminRequestType,
      }, function () {
        $scope.offerings.forEach(function(offering) {
          offering.description = LanguageService.getTextForCurrentLanguage(offering.title);
        });
        $scope.buildPager();
      }, function (errorResponse) {
        console.log('Offering: Admin error response is: ' + JSON.stringify(errorResponse));
      });
    };

  }
]);
