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
      .state('offerings.list', {
        url: '',
        templateUrl: 'modules/offerings/client/views/list-offerings.client.view.html'
      })
      .state('offerings.create', {
        url: '/create',
        templateUrl: 'modules/offerings/client/views/create-offering.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('offerings.view', {
        url: '/:offeringId',
        templateUrl: 'modules/offerings/client/views/view-offering.client.view.html'
      })
      .state('offerings.edit', {
        url: '/:offeringId/edit',
        templateUrl: 'modules/offerings/client/views/edit-offering.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
