'use strict';

// Setting up route
angular.module('firststep').config(['$stateProvider',
  function ($stateProvider) {
    // Offerings state routing
    $stateProvider
      .state('firststep', {
        abstract: true,
        url: '/firststep',
        template: '<ui-view/>'
      })
      .state('firststep.resources', {
        url: '/resources',
        templateUrl: 'modules/firststep/client/views/help-resources.client.view.html'
      });
  }
]);
