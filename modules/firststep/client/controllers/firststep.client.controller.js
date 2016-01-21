'use strict';

// Controller handling offering searches
angular.module('firststep').controller('FirstStepController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                               'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, LanguageService) {

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      // Load the new language-specific content
      $scope.initialize();
    });

    // TODO: We may want to add a call to get the current geo-location,
    // so we can show resources in the user's area

    // Load the language-specific content
    $scope.initialize = function() {
      // initialize all properties in the view (html)
      LanguageService.getPropertiesByViewName('firststep', $http, function(translationList) {
        $scope.properties = translationList;
        $scope.resources = [
          { 'header': $scope.properties.ankommenHeader,
            'description': $scope.properties.ankommenDescription,
            'link': 'https://www.ankommenapp.de' },
          { 'header': $scope.properties.generalHeader,
            'description': $scope.properties.generalDescription,
            'link': 'http://www.bundesregierung.de/Webs/Breg/DE/Themen/Fluechtlings-Asylpolitik/4-FAQ/_node.html' },
          { 'header': $scope.properties.asylumHeader,
            'description': $scope.properties.asylumDescription,
            'link': $scope.properties.asylumLink },
          { 'header': $scope.properties.onlineGermanHeader,
            'description': $scope.properties.onlineGermanDescription,
            'link': $scope.properties.onlineGermanLink },
          { 'header': $scope.properties.integrationHeader,
            'description': $scope.properties.integrationDescription,
            'link': $scope.properties.integrationLink },
          { 'header': $scope.properties.projectsHeader,
            'description': $scope.properties.projectsDescription,
            'link': 'http://www.tagesschau.de/fluechtlingsprojekte' },
        ];
      });
    };
  }
]);
