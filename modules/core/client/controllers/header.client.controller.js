'use strict';
/* global Materialize:false */

angular.module('core').controller('HeaderController', ['$scope', '$state', 'Authentication', 'Menus',
  function ($scope, $state, Authentication, Menus) {
    // Expose view variables
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
  }
]);

angular.module('core').controller('HeaderNewOfferingsController', ['$scope', 'Authentication', 'Socket',
  function ($scope, Authentication, Socket) {
    $scope.authentication = Authentication;

    if (!Authentication.user) return;

    // Make sure the Socket is connected
    if (!Socket.socket) {
      Socket.connect();
    }

    // Add an event listener to the 'offeringMessage' event - and limit to 3 messages
    Socket.on('offeringMessage', function (message) {
      var toastContent = '<span>new ' + message.content.category;

      if (message.content.offerType === 0) {
        toastContent = toastContent + ' request: ';
      } else {
        toastContent = toastContent + ' offering: ';
      }

      toastContent = toastContent + 
        message.content.description.substr(0,10) + ' - posted by user ' + message.username.substr(1,20);

      console.log('new stuff ' + toastContent);
      Materialize.toast(toastContent, 5000);
    });

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function () {
      Socket.removeListener('offeringMessage');
    });
  }
]);
