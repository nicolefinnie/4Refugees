'use strict';

// Setting up route
angular.module('offerings').config(['$stateProvider',
  function ($stateProvider) {
    // Offerings state routing
    $stateProvider
      .state('offerings', {
        abstract: true,
        url: '/offerings',
        template: '<ui-view/>'
      })
      .state('offerings.listMine', {
        url: '',
        templateUrl: 'modules/offerings/client/views/list-my-offerings.client.view.html'
      })
      // it doesn't authenticate the user but routes to the search page directly
      .state('offerings.searchAll', {
        url: '/search?offerType',
        templateUrl: 'modules/offerings/client/views/search-all-offerings.client.view.html',
        controller: function($scope, $stateParams) {
          $scope.offerType = $stateParams.offerType;
        }
      })
      // works in order, first, it has to be user or admin, second, it stores the parameter offerType and passes its value to $scope
      .state('offerings.create', {
        url: '/create?offerType&offeringId',
        params: {
          offerType: null,
          offeringId: null
        },
        templateUrl: 'modules/offerings/client/views/create-offering.client.view.html',
        data: {
          roles: ['user', 'admin']
        },
        controller: function($scope, $stateParams) {
          $scope.offerType = $stateParams.offerType;
          $scope.offeringId = $stateParams.offeringId;
        }
      })
      .state('offerings.view', {
        url: '/view?offerType&offeringId',
        templateUrl: 'modules/offerings/client/views/create-offering.client.view.html',
        data: {
          roles: ['user', 'admin']
        },
        controller: function($scope, $stateParams) {
          $scope.offerType = $stateParams.offerType;
          $scope.offeringId = $stateParams.offeringId;
        }
      })
      .state('offerings.edit', {
        url: '/edit?offerType&offeringId',
        templateUrl: 'modules/offerings/client/views/create-offering.client.view.html',
        data: {
          roles: ['user', 'admin']
        },
        controller: function($scope, $stateParams) {
          $scope.offerType = $stateParams.offerType;
          $scope.offeringId = $stateParams.offeringId;
        }
      });
  }
]);
