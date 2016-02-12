'use strict';

// Setting up route
angular.module('matches').config(['$stateProvider',
  function ($stateProvider) {
    // Offerings state routing
    $stateProvider
      .state('matches', {
        abstract: true,
        url: '/matches',
        template: '<ui-view/>'
      })
      .state('matches.admin', {
        url: '/admin',
        templateUrl: 'modules/matches/client/views/admin-matches.client.view.html',
        data: {
          roles: ['admin']
        },
      })
      .state('matches.listMine', {
        url: '',
        templateUrl: 'modules/matches/client/views/list-my-matches.client.view.html'
      })
      // works in order, first, it has to be user or admin, second, it stores the parameters under $scope
      .state('matches.createFromOffer', {
        url: '/create?offeringId&offeringDescription&recipientName&recipientId&matchId',
        params: {
          offeringId: null,
          offeringDescription: null,
          recipientName: null,
          recipientId: null,
          matchId: null
        },
        templateUrl: 'modules/matches/client/views/list-my-matches.client.view.html',
        data: {
          roles: ['user', 'admin']
        },
        controller: function($scope, $stateParams) {
          $scope.offeringId = $stateParams.offeringId;
          $scope.offeringDescription = $stateParams.offeringDescription;
          $scope.recipientName = $stateParams.recipientName;
          $scope.recipientId = $stateParams.recipientId;
          $scope.matchId = '0';
        }
      })
      .state('matches.edit', {
        url: '/edit?matchId',
        templateUrl: 'modules/matches/client/views/list-my-matches.client.view.html',
        data: {
          roles: ['user', 'admin']
        },
        controller: function($scope, $stateParams) {
          $scope.matchId = $stateParams.matchId;
        }
      });
  }
]);
