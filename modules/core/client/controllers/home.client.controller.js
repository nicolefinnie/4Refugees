'use strict';

angular.module('core').controller('HomeController', ['$scope', '$http', '$rootScope','Authentication','LanguageService',
  function ($scope, $http, $rootScope, Authentication, LanguageService) {
 
    // This provides Authentication context.
    $scope.authentication = Authentication;
    
    //initialize view properties of home
    LanguageService.getPropertiesByViewName('home', $http, function(translationList) {
      $scope.properties = translationList;
    });
    
    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      //refresh view properties of home
      LanguageService.getPropertiesByViewName('home', $http, function(translationList) {
        $scope.properties = translationList;
      });
    });
    
  }
]);


