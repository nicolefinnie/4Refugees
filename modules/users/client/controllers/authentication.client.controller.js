'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$rootScope', '$state', '$http', '$location', '$window', 
                                                                'Authentication', 'PasswordValidator', 'LanguageService',
  function ($scope, $rootScope, $state, $http, $location, $window, Authentication, PasswordValidator, LanguageService) {
  
    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      //refresh view properties of home
      LanguageService.getPropertiesByViewName('user', $http, function(translationList) {
        $scope.properties = translationList;
      });
    });

    // Startup timing issue... the header controller will initialize itself and
    // set the current language.  If it finishes initializing itself before the
    // home controller starts, then the home controller will never get the
    // 'tellAllControllersToChangeLanguage' notification when the initial language
    // is set.  So, only load our properties if a language change is not in progress,
    // otherwise wait until we get the language-change-notification.
    if (LanguageService.isLanguageLoadInProgress() === false) {
      LanguageService.getPropertiesByViewName('user', $http, function(translationList) {
        $scope.properties = translationList;
      });
    }
  
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();
    // global variable function
    $rootScope.hideFooter = true;
    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    // if advanced sing-in is toggled, show details or hide details
    $scope.toggleSignIn = function() {
      $scope.showSignIn = !$scope.showSignIn;
    };
    
    // if advanced sing-up is toggled, show details or hide details
    $scope.toggleSignUp = function() {
      $scope.showSignUp = !$scope.showSignUp;
    };
    
    // If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    $scope.signup = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signup', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    $scope.signin = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    // OAuth provider request
    $scope.callOauthProvider = function (url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    };
  }
]);
