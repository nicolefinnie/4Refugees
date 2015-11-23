'use strict';
/* global Materialize:false */

angular.module('core').controller('HeaderController', ['$scope', '$state', '$http', 'Authentication', 'Menus', 'Socket',
  function ($scope, $state, $http, Authentication, Menus, Socket) {
    // Expose view variables
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

    $scope.hasPostingBadge = false;

    // set 'new' badge to InMail if there is unread mail for me
    $http.get('/api/postings?unread=true',{ cache: true }).then(function(response) {
      var postings = response.data;
      if (postings.length > -1) $scope.hasPostingBadge = true;
    });

    //if (Authentication.user) {
       //$scope.postingBadge = hasUserNewMessages(Authentication.user);
    //}

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

    // Add an event listener to the 'postingMessage' event and show new inMails for logged in users
    Socket.on('postingMessage', function (message) {

      // TODO - do not check against the SENDER userName
      if (message.content.recipient === Authentication.user._id) {
        if (message.content.title) {
          console.log('Received new email');
          $scope.hasPostingBadge = true;
        }
        else {
          console.log('Received remove email');
          $scope.hasPostingBadge = false;
        }
      }
      else
      {
        console.log('Somebody else received email');
      }

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
        message.content.description.substr(0,10) + ' - posted by user ' + message.username.substr(0,20);

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
