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
      .state('mails.createadmin', {
        url: '/createadmin',
        templateUrl: 'modules/mails/client/views/createadmin-mail.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
