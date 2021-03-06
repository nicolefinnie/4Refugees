'use strict';
/* global Materialize:false */

angular.module('core').controller('HeaderController', ['$scope', '$rootScope', '$state', '$http', '$interval', 'Authentication', 'Menus', 'Socket', 'LanguageService', 'MailService', '$log',
  function ($scope, $rootScope, $state, $http, $interval, Authentication, Menus, Socket, LanguageService, MailService, log) {
    // Expose view variables 
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // initialize mobile side navigation
    $('.button-collapse').sideNav();

    // language change clicked
    $scope.changeLanguage = function (language) {
      LanguageService.changeLanguage($scope, language, true);
    };

    // Set the initial language to English if not logged in
    if (!Authentication.user) {
      $scope.changeLanguage('en');
    } else {
      $scope.changeLanguage(Authentication.user.languagePreference);
    }

    // TODO Find better way of alerting the user of new mail using IBM icons
    $scope.hasUnreadMail = false;
    $scope.unreadMailCount = 0;

    $scope.checkAdminRole = function() {
      if (Authentication && Authentication.user) {
        return (Authentication.user.roles.indexOf('admin') > -1);
      }
      return false;
    };
        
    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });

    // Set of all tasks that should be performed periodically
    $scope.runIntervalTasks = function() {
      if (Authentication.user) {
        // Check for unread mail, set menu flag to alert user if they have new mail.
        MailService.checkForUnreadMail($http, function(unreadMailCount) {
          $scope.hasUnreadMail = (unreadMailCount > 0);
          // Notify the mail module, if active, that new mail has been received.
          if (unreadMailCount > $scope.unreadMailCount) {
            $rootScope.$broadcast('newMailReceived');
          }
          $scope.unreadMailCount = unreadMailCount;
        });
      }
    };

    var polling; // promise, set when we start intervals, used to cancel intervals.
    $scope.startPolling = function(pollingInterval) {
      polling = $interval(function() {
        $scope.runIntervalTasks();
      }, pollingInterval);
    };

    $scope.stopPolling = function() {
      if (angular.isDefined(polling)) {
        $interval.cancel(polling);
        polling = undefined;
      }
    };

    // Someone asked us to refresh
    $rootScope.$on('refreshHeader', function(){
      // Check for new mails/etc only once per minute, to limit load on server
      var pollingInterval = 60000;
      // Prevent race conditions - stop any current polling, then issue a new
      // refresh task immediately, and then start polling.  Note that polling
      // sleeps first, so we won't be running two refreshes back-to-back.
      $scope.stopPolling();
      $scope.runIntervalTasks();
      $scope.startPolling(pollingInterval);
    });

    // Tell ourselves to refresh new mail count and start polling
    $rootScope.$broadcast('refreshHeader');

    $scope.$on('$destroy', function() {
      $scope.stopPolling();
    });
   
    // listen for language change in header because other modules can trigger it too (e.g. after signing in)
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      //refresh view properties of home
      LanguageService.getPropertiesByViewName('header', $http, function(translationList) {
        $scope.properties = translationList;
      });
    });

  }
]);

