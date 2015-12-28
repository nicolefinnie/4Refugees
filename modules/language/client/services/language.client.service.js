'use strict';
   
/**
 * Global language service, it provides APIs defined below. 
 * 
 * To use this global service, make sure to include LanguageService in your controller.
 * 
 * For example, to refresh your GUI view when the language changes, call getPropertiesByViewName()
 * The view name is defined under public/language/xx/xx_viewProperties 
 * 
 * @code 
  angular.module('core').controller('HomeController', ['$http', '$rootScope','LanguageService',
    function ($http, $rootScope, Authentication, LanguageService) {
 
   // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      //refresh view properties of home
      LanguageService.getPropertiesByViewName('home', $http, function(translationList) {
        $scope.properties = translationList;
      });
    });
    
    }
  ]);
 * @endcode
 * 
 * The APIs currently offered are:
 * 
 * //only header needs to set it because the language is changed in header
 * setCurrentLanguage(language); 
 * getCurrentLanguage();
 * getPropertiesByViewName();
 * 
 **/
angular.module('language').service('LanguageService', [function () {
  this.globalCurrentLanguage = 'en';
  this.translations = { 'en':[], 'de':[], 'ar':[] };
  this.getCurrentLanguage = function() {
    return this.globalCurrentLanguage;
  };
  
  this.setCurrentLanguage = function(newLanguage){
    this.globalCurrentLanguage = newLanguage;
  };
  
  // e.g. viewName is the name of an HTML view, 'home', 'header', 'offering', please refer to public/language/xx_viewProperties 
  this.getPropertiesByViewName = function(viewName, $http, callback) {
    var self = this;
    var url = 'language/en/en_viewProperties';
    if (this.globalCurrentLanguage === 'de'){
      url = 'language/de/de_viewProperties';
    } else if (this.globalCurrentLanguage === 'ar'){
      url = 'language/ar/ar_viewProperties';
    }
    
    if (self.translations[self.globalCurrentLanguage].length === 0) {
      $http({
        method: 'GET',
        url: url
      }).then(function successCallback(response) {
      /*jshint evil:true */
      // Note - the above jshint directive allows us to use the 'eval' function below,
      // to transform the data received directly into an array of JSON objects.
        console.log('LanguageService: initially loaded ' + self.globalCurrentLanguage + ' language with status ' + response.status + ' to cache');
        try {
          self.translations[self.globalCurrentLanguage] = eval(response.data);        
          
          self.translations[self.globalCurrentLanguage].forEach(function(translation) {
            if (translation.viewName === viewName) {
              callback(translation);
            }
          });
        } catch(e) {
          console.log('LanguageService: Error parsing view property list in \'public/'+ url + '\'.  Exception: ' + e);
          //TODO throw exception
        }
      }, function errorCallback(response) {
        console.log('LanguageService: Error \'' + response.status + '\' loading view property list in \'public/'+ url+ '\'.');
        //TODO throw exception
      });    
    } else {
      self.translations[self.globalCurrentLanguage].forEach(function(translation) {
        if (translation.viewName === viewName) {
          callback(translation);
        }
      });
    }
  };
  
}
]);