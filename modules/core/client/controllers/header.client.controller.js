'use strict';
/* global Materialize:false */

angular.module('core').controller('HeaderController', ['$scope', '$state', 'Authentication', 'Menus', 'Socket',
  function ($scope, $state, Authentication, Menus, Socket) {
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

    // Make sure the Socket is connected
    if (!Socket.socket) {
      Socket.connect();
    }

    // Add an event listener to the 'postingMessage' event and show new postings for logged in users
    Socket.on('postingMessage', function (message) {

      // TODO - do not check against the SENDER userName
      //if (Authentication.user.userName === message.username) {
      console.log('Received posting');
      
      //document.getElementById("postingBadge").className = "new badge";
      //$scope.find('#postingBadge').className = 'new badge';
      $scope.postingBadge = 'new badge';
      //}
    });
  }
]);

angular.module('core').controller('HeaderNewOfferingsController', ['$scope', 'Authentication', 'Socket',
  function ($scope, Authentication, Socket) {
    $scope.authentication = Authentication;

    // Make sure the Socket is connected
    if (!Socket.socket) {
      Socket.connect();
    }

    // Add an event listener to the 'offeringMessage' event and toast logged in users
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

      // only post users logged in
      if (Authentication.user) {
        Materialize.toast(toastContent, 5000);
      }
    });

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function () {
      Socket.removeListener('offeringMessage');
    });
  }
]);
