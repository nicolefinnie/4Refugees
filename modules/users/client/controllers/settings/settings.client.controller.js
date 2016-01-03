'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$rootScope', '$http', 'Authentication', 'LanguageService',
  function ($scope, $rootScope, $http, Authentication, LanguageService) {
    //TODO grunt test
    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      // Load the new language-specific content
      $scope.initialize();
    });
    // Load the language-specific content
    $scope.initialize = function() {
      // initialize all properties in the view (html)
      LanguageService.getPropertiesByViewName('user', $http, function(translationList) {
        $scope.properties = translationList;
      });  
    };
  
    $scope.user = Authentication.user;
  }
]);
