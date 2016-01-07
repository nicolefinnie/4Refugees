'use strict';

// Controller handling offering searches
angular.module('about').controller('AboutController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                               'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, LanguageService) {

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      // Load the new language-specific content
      $scope.initialize();
    });
    
    // Load the language-specific content
    $scope.initialize = function() {
      // initialize all properties in the view (html)
      LanguageService.getPropertiesByViewName('about', $http, function(translationList) {
        $scope.properties = translationList;
      });
    };
  }
]);
