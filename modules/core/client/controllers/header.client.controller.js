'use strict';
/* global Materialize:false */

angular.module('core').controller('HeaderController', ['$scope', '$rootScope', '$state', '$http', '$interval', 'Authentication', 'Menus', 'Socket', 'LanguageService', 'MailService', '$log', 'UserService',
  function ($scope, $rootScope, $state, $http, $interval, Authentication, Menus, Socket, LanguageService, MailService, log, UserService) {
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
        // update settings with the language chosen
        UserService.updateUserProfile($scope, true);
      }
      // refresh view properties in the current language 
      LanguageService.getPropertiesByViewName('header', $http, function(translationList) {
        $scope.properties = translationList;
        // broadcast this language change to HomeController to refresh
        $rootScope.$broadcast('tellAllControllersToChangeLanguage');
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
  }
]);

