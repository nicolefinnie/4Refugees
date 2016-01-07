'use strict';

// Setting up route
angular.module('about').config(['$stateProvider',
  function ($stateProvider) {
    // Offerings state routing
    $stateProvider
      .state('about', {
        abstract: true,
        url: '/about',
        template: '<ui-view/>'
      })
      .state('about.aboutUs', {
        url: '/aboutus',
        templateUrl: 'modules/about/client/views/about.client.view.html'
      });
  }
]);
