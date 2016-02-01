'use strict';

angular.module('core').controller('FooterController', ['$scope', '$http', '$rootScope','Authentication','LanguageService',
  function ($scope, $http, $rootScope, Authentication, LanguageService) {
    // This provides Authentication context.
    // This provides Authentication context.
    $scope.authentication = Authentication;
   
    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
        //refresh view properties of home
      LanguageService.getPropertiesByViewName('footer', $http, function(translationList) {
        $scope.properties = translationList;
      });
    });

    // Startup timing issue... the header controller will initialize itself and
    // set the current language.  If it finishes initializing itself before the
    // home controller starts, then the footer controller will never get the
    // 'tellAllControllersToChangeLanguage' notification when the initial language
    // is set.  So, only load our properties if a language change is not in progress,
    // otherwise wait until we get the language-change-notification.
    if (LanguageService.isLanguageLoadInProgress() === false) {
      LanguageService.getPropertiesByViewName('footer', $http, function(translationList) {
        $scope.properties = translationList;
      });
    }
  }
]);


