'use strict';

// Setting up route
angular.module('mails').config(['$stateProvider',
  function ($stateProvider) {
    // Mails state routing
    $stateProvider
      .state('mails', {
        abstract: true,
        url: '/mails',
        template: '<ui-view/>'
      })
      .state('mails.list', {
        url: '',
        templateUrl: 'modules/mails/client/views/list-mails.client.view.html'
      })
      .state('mails.listnew', {
        url: '/unread',
        templateUrl: 'modules/mails/client/views/listnew-mails.client.view.html'
      })
      .state('mails.search', {
        url: '',
        templateUrl: 'modules/mails/client/views/list-mails.client.view.html'
      })
      .state('mails.create', {
        url: '/create',
        templateUrl: 'modules/mails/client/views/create-mail.client.view.html',
        data: {
          roles: ['user']
        }
      })
      .state('mails.createFromOffer', {
        url: '/createFromOffer',
        params: {
          offeringId: null,
          offeringDescription: null,
          recipientName: null,
          recipientId: null
        },
        templateUrl: 'modules/mails/client/views/create-mail-offer.client.view.html',
        data: {
          roles: ['user']
        },
        controller: function($scope, $stateParams) {
          $scope.offeringId = $stateParams.offeringId;
          $scope.offeringDescription = $stateParams.offeringDescription;
          $scope.recipientName = $stateParams.recipientName;
          $scope.recipientId = $stateParams.recipientId;
        }
      })
      .state('mails.createFromOfferSuccess', {
        url: '/createFromOfferSuccess',
        templateUrl: 'modules/mails/client/views/create-mail-offer-success.client.view.html',
        data: {
          roles: ['user']
        }
      })
      .state('mails.createadmin', {
        url: '/createadmin',
        templateUrl: 'modules/mails/client/views/createadmin-mail.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('mails.view', {
        url: '/:mailId',
        templateUrl: 'modules/mails/client/views/view-mail.client.view.html'
      })
      .state('mails.edit', {
        url: '/:mailId/edit',
        templateUrl: 'modules/mails/client/views/edit-mail.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
