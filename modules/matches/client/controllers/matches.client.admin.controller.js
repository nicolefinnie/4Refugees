'use strict';

// Matches controller only available for admins
angular.module('matches').controller('MatchesAdminController', ['$scope', '$filter', '$http', '$stateParams', '$location', 'Authentication', 'LanguageService', 'Matches',
  function ($scope, $filter, $http, $stateParams, $location, Authentication, LanguageService, Matches) {
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
      $scope.filteredItems = $filter('filter')($scope.matches, {
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

    // Remove single Match
    $scope.removeSingleMatch = function (match) {
      match.$remove(function () {
        console.log('Match: Admin: completed remove request.');
      });
    };

    // Remove one match from within list of all matches
    $scope.removeMatchFromList = function (match) {
      match.$remove();
      for (var i in $scope.matches) {
        if ($scope.matches[i] === match) {
          $scope.matches.splice(i, 1);
        }
      }
    };

    // Send an admin request to the server
    $scope.sendAdminRequest = function (adminRequestType) {
      $scope.matches = Matches.query({
        adminRequest: adminRequestType,
      }, function () {
        $scope.matches.forEach(function(match) {
          if (match.offering) {
            match.offering.description = LanguageService.getTextForCurrentLanguage(match.offering.title);
          } else {
            match.offering = { description: '[Offering Not Found]' };
          }
          if (!match.owner) {
            match.owner = { displayName: '[Owner Not Found]' };
          }
          if (!match.requester) {
            match.requester = { displayName: '[Requester Not Found]' };
          }
        });
        $scope.buildPager();
      }, function (errorResponse) {
        console.log('Match: Admin error response is: ' + JSON.stringify(errorResponse));
      });
    };

  }
]);
