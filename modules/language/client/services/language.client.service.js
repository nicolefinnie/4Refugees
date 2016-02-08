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

    var textTranslations = [
      { language: 'en', text: 'Day' },
      { language: 'de', text: 'Tag' }
    };
    // curText will be set to either 'Day', or 'Tag', depending on the current
    // language as returned by LanguageService.getCurrentLanguage()
    var curText = LanguageService.getTextForCurrentLanguage(textTranslations);

  ]);
 * @endcode
 * 
 * The APIs currently offered are:
 * 
 * //only header needs to set it because the language is changed in header
 * setCurrentLanguage(language); 
 * getCurrentLanguage();
 * //only home needs to check this to avoid race conditions, since the home page
 * //is the only case when two controllers may be initializing at the same time 
 * isLanguageLoadInProgress();
 * getPropertiesByViewName();
 * getTextForCurrentLanguage(textArray);
 * //only needed for unit tests
 * setupTestEnvironment();
 * 
 **/
angular.module('language').service('LanguageService', ['UserService', 'Authentication', '$http', '$rootScope', function (UserService, Authentication, $http, $rootScope) {

  this.globalCurrentLanguage = 'en';
  this.translations = { 'en':[], 'de':[], 'ar':[] };
  this.languageLoadInProgress = false;

  this.getCurrentLanguage = function() {
    return this.globalCurrentLanguage;
  };

  this.isLanguageLoadInProgress = function() {
    return this.languageLoadInProgress;
  };

  this.setCurrentLanguage = function(newLanguage) {
    this.globalCurrentLanguage = newLanguage;
  };

  this.getTextForCurrentLanguage = function(textArray) {
    var self = this;
    var result;
    var fallbackResult = textArray[0].text;
    textArray.forEach(function(translation) {
      if (translation.language === self.globalCurrentLanguage) {
        result = translation.text;
      } else if (translation.language === 'en') {
        // Default to English, if we don't find a perfect match
        fallbackResult = translation.text;
      }
    });
    if (result) {
      return result;
    } else {
      // If no perfect translation was found, return the best possible match
      return fallbackResult;
    }
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
      self.languageLoadInProgress = true;
      $http({
        method: 'GET',
        url: url
      }).then(function successCallback(response) {
        console.log('LanguageService: initially loaded ' + self.globalCurrentLanguage + ' language with status ' + response.status + ' to cache');
        try {
          self.translations[self.globalCurrentLanguage] = response.data;
          // Now go through the array, and add the 'common' properties to all others
          var commonProperties = self.translations[self.globalCurrentLanguage][0];
          if (commonProperties.viewName !== 'common') { throw new Error('Expected \'common\' viewName, but saw: ' + commonProperties.viewName); }
          var resultTranslation;
          for (var i = 1; i < self.translations[self.globalCurrentLanguage].length; i++) {      
            // Add common properties unless overridden by more specific translations in the viewName.
            self.translations[self.globalCurrentLanguage][i] = $.extend({ }, commonProperties, self.translations[self.globalCurrentLanguage][i]);
            if (self.translations[self.globalCurrentLanguage][i].viewName === viewName) {
              resultTranslation = self.translations[self.globalCurrentLanguage][i];
              // Don't break yet, we want to add the common properties to all viewNames
            }
          }

          if (!resultTranslation) { throw new Error('Could not find translations for viewName: ' + viewName); }

          self.languageLoadInProgress = false;
          callback(resultTranslation);
        } catch(e) {
          self.languageLoadInProgress = false;
          throw new Error('LanguageService: Error parsing view property list in \'public/'+ url + '\'.  Exception: ' + e);
        }
      }, function errorCallback(response) {
        self.languageLoadInProgress = false;
        throw new Error('LanguageService: Error \'' + response.status + '\' loading view property list in \'public/'+ url+ '\'.');
      });    
    } else {
      var resultTranslation;
      self.translations[self.globalCurrentLanguage].some(function(translation) {
        if (translation.viewName === viewName) {
          resultTranslation = translation;
          return true; // break out early once we've found our viewName
        }
      });
      if (!resultTranslation) { throw new Error('Could not find translations for viewName: ' + viewName); }
      callback(resultTranslation);
    }
  };

  // For unit tests, setup fake/sample language data
  this.setupTestEnvironment = function() {
    // Some unit tests have a requirement that this.getPropertiesByViewName()
    // issues the callback when asked to get their translations.
    var testTranslations = [{ 'viewName':'offering' }, { 'viewName':'user' }, { 'viewName':'mail' }];
    this.translations[this.globalCurrentLanguage] = testTranslations;
  };

  // change language and broadcast to all other controller to cause a language refresh
  this.changeLanguage = function (scope, language, refreshUserObject) {
    // set the current language
    this.setCurrentLanguage(language);
    // if the user is logged in, also automatically update the preferred language in the user object
    if (Authentication.user && refreshUserObject) {
      Authentication.user.languagePreference = language;
      UserService.updateUserProfile(Authentication.user, function(errorResponse, userProfile){});
    }
    // refresh view properties in the current language 
    this.getPropertiesByViewName('header', $http, function(translationList) {
      scope.properties = translationList;
      // broadcast this language change to HomeController to refresh
      $rootScope.$broadcast('tellAllControllersToChangeLanguage');
    });
  };

}
]);