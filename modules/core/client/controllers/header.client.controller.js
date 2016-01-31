'use strict';
/* global Materialize:false */

angular.module('core').controller('HeaderController', ['$scope', '$rootScope', '$state', '$http', '$interval', 'Authentication', 'Menus', 'Socket', 'LanguageService', 'MailService', '$log', 'Users',
  function ($scope, $rootScope, $state, $http, $interval, Authentication, Menus, Socket, LanguageService, MailService, log, Users) {
    // Expose view variables 
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // initialize mobile side navigation
    $('.button-collapse').sideNav();

    // language change clicked
    $scope.changeLanguage = function (language) {
      // set the current language in the language service
      LanguageService.setCurrentLanguage(language);
      // if the user is logged in, also automatically update the preferred language in the user object
      if (Authentication.user) {
        var user = Authentication.user;
        // update settings with the language chosen
        $scope.updateUserProfile(language);
      }
      // refresh view properties in the current language 
      LanguageService.getPropertiesByViewName('header', $http, function(translationList) {
        $scope.properties = translationList;
        // broadcast this language change to HomeController to refresh
        $rootScope.$broadcast('tellAllControllersToChangeLanguage');
      });
    };

    // Update a user profile with the chosen language
    $scope.updateUserProfile = function (language) {
      var user = new Users($scope.user);
      user.languagePreference = language;
      user.$update(function (response) {
        Authentication.user = response;
      }, function (response) {
        $scope.error = response.data.message;
      });
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
        // Check for unread mail, set flag to alert user if they have new mail.
        MailService.checkForUnreadMail($http, function(unreadMailCount) {
          $scope.hasUnreadMail = (unreadMailCount > 0);
          $scope.unreadMailCount = unreadMailCount;
        });
      }
    };

    // Polling interval is more frequent until we are authenticated.
    // Before authentication, polling is a no-op.  This way, we can
    // refresh quickly as soon as we authenticate, and then slow down
    // to reduce load on the server.
    $scope.getPollingInterval = function() {
      var pollingInterval = 5000;
      if (Authentication.user) {
        pollingInterval = 60000;
      }
      return pollingInterval;
    };

    var polling; // promise, set when we start intervals, used to cancel intervals.
    var pollingInterval = $scope.getPollingInterval();
    $scope.startPolling = function() {
      polling = $interval(function() {
        $scope.runIntervalTasks();
        var newPollingInterval = $scope.getPollingInterval();
        // Check if our polling interval needs to change - i.e. we just Authenticated.
        if (newPollingInterval !== pollingInterval) {
          $scope.stopPolling();
          pollingInterval = newPollingInterval;
          $scope.startPolling();
        }
      }, pollingInterval);
    };

    $scope.stopPolling = function() {
      if (angular.isDefined(polling)) {
        $interval.cancel(polling);
        polling = undefined;
      }
    };

    // And now start our polling
    $scope.runIntervalTasks();
    $scope.startPolling();

    $scope.$on('$destroy', function() {
      $scope.stopPolling();
    });
  }
]);

