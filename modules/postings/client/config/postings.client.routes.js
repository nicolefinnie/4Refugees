'use strict';

// Setting up route
angular.module('postings').config(['$stateProvider',
  function ($stateProvider) {
    // Postings state routing
    $stateProvider
      .state('postings', {
        abstract: true,
        url: '/postings',
        template: '<ui-view/>'
      })
      .state('postings.list', {
        url: '',
        templateUrl: 'modules/postings/client/views/list-postings.client.view.html'
      })
      .state('postings.listnew', {
        url: '/unread',
        templateUrl: 'modules/postings/client/views/listnew-postings.client.view.html'
      })
      .state('postings.search', {
        url: '',
        templateUrl: 'modules/postings/client/views/list-postings.client.view.html'
      })
      .state('postings.create', {
        url: '/create',
        templateUrl: 'modules/postings/client/views/create-posting.client.view.html',
        data: {
          roles: ['user']
        }
      })
      .state('postings.createFromOffer', {
        url: '/createFromOffer?offeringId',
        templateUrl: 'modules/postings/client/views/create-posting-offer.client.view.html',
        data: {
          roles: ['user']
        }
      })
      .state('postings.createFromOfferSuccess', {
        url: '/createFromOfferSuccess',
        templateUrl: 'modules/postings/client/views/create-posting-offer-success.client.view.html',
        data: {
          roles: ['user']
        }
      })
      .state('postings.createadmin', {
        url: '/createadmin',
        templateUrl: 'modules/postings/client/views/createadmin-posting.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('postings.view', {
        url: '/:postingId',
        templateUrl: 'modules/postings/client/views/view-posting.client.view.html'
      })
      .state('postings.edit', {
        url: '/:postingId/edit',
        templateUrl: 'modules/postings/client/views/edit-posting.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
