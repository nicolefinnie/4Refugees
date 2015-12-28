'use strict';

// Converts the category selections from the input form into an
// array of category strings
function getCategoryArray(cat, defaultSetting) {
  if (cat && cat.length !== 0) {
    var myArray = [];
    var anyFound = false;
    Object.keys(cat).forEach(function(category) {
      if (cat[category] === true) {
        myArray.push(category);
        anyFound = true;
      }
    });
    if (anyFound === false) {
      myArray.push(defaultSetting);
    }
    return myArray;
  } else {
    return [defaultSetting];
  }
}

// Convert category string as returned by server back into
// the same format used when selecting categories
function convertEnglishCategory(categories, lang, scope)
{
  var converted = '';
  var addComma = false;
  var catArray = categories.toString().split(',');
  catArray.forEach(function(cat) {
    if (addComma) {
      if (lang === 'ar') {
        converted = converted + '، ';
      } else {
        converted = converted + ', ';
      }
    } else {
      addComma = true;
    }
    if (cat === 'training') {
      converted = converted + scope.properties.jobTraining;
    } else if (cat === 'courses') {
      converted = converted + scope.properties.languageCourses;
    } else if (cat === 'medical') {
      converted = converted + scope.properties.medicalAssistance;
    } else if (cat === 'childcare') {
      converted = converted + scope.properties.childCare;
    } else if (cat === 'others') {
      converted = converted + scope.properties.others;
    }
  });
  return converted;
}

// Convert offer/request string as returned by server to appropriate language
function convertEnglishOfferType(offerEnglish, scope)
{
  var converted = '';
  if (offerEnglish === 'offer') {
    converted = scope.properties.offer;
  } else if (offerEnglish === 'request') {
    converted = scope.properties.request;
  } else if (offerEnglish === 'offer (expired)') {
    converted = scope.properties.offerExpired;
  } else if (offerEnglish === 'request (expired)') {
    converted = scope.properties.requestExpired;
  }
  return converted;
}

// Converts UTC date strings returned by server into locale Date objects
function convertServerOfferingUTCDateToLocal(offering) {
  offering.when = new Date(offering.when);
  offering.expiry = new Date(offering.expiry);
  offering.updated = new Date(offering.updated);
}

// Converts server offering JSON into client offering, for integration with views.
function convertServerOfferingToClientViewOffering(language, $scope, offering) {
  offering.category = convertEnglishCategory(offering.category, language, $scope);
  offering.offerType = convertEnglishOfferType(offering.offerType, $scope);
  convertServerOfferingUTCDateToLocal(offering);
}

// Ask for our current city+coordinates from Geo services
function geoGetCurrentLocation(GeoService, $scope, $http) {
  GeoService.getCurrentLocation(function(myLocation, digestInProgress) {
    if (myLocation.available) {
      $scope.city = myLocation.city;
      $scope.latitude = myLocation.latitude;
      $scope.longitude = myLocation.longitude;
      $scope.geoManual = false;
      if (!digestInProgress) {
        // Force a digest round to pick up the newly-found city name
        $scope.$apply();
      }
    } else {
      GeoService.getCityList($http, function(cityList, digestInProgress) {
        $scope.geoManual = true;
        $scope.citylist = cityList;
        if (!digestInProgress) {
          // Force a digest round to pick up the list of cities to choose from
          $scope.$apply();
        }
      });
    }
  });
}

// Validate a suitable geoLocation was specified
function geoValidateLocation(scope) {
  var isValid = (scope.longitude !== undefined && scope.latitude !== undefined);
  // if google geo is not reachable or user does not allow it
  if (!isValid && scope.where)
  {
    isValid = true;
    scope.city = scope.where.name;
    scope.longitude = scope.where.lng;
    scope.latitude = scope.where.lat;
  }
  if (!isValid) {
    scope.error = scope.properties.errorNoCity;
    throw new Error('Offering: Invalid location');
  }
}

// Controller handling offering searches
angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                                     'Authentication', 'Offerings', 'Socket', 'GeoService', 'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, Socket, GeoService, LanguageService) {
    $scope.authentication = Authentication;

    // initialize all properties in the view (html)
    LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
      $scope.properties = translationList;
    });

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
      });
    });
    
    // Ask for our current city+coordinates from Geo services
    geoGetCurrentLocation(GeoService, $scope, $http);

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    $scope.messages = [];

    // Search all offerings for the input criteria
    $scope.searchAll = function (isValid) {
        
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringFormSearch');
        return false;
      }

      geoValidateLocation($scope);

      // TODO: Should we re-direct to a new page? or render a new page?
      $scope.offerings = Offerings.query({
        description: this.description,
        descriptionLanguage: LanguageService.getCurrentLanguage(),
        city: this.city,
        longitude: this.longitude,
        latitude: this.latitude,
        radius: this.radius? this.radius:10,
        when: this.when,
             // mapping JSON array category from checkbox on webpage to String
        category: getCategoryArray(this.category, ''),
        offerType: this.offerType 
      }, function () {
        if ($scope.offerings.length < 1) {
          $scope.error = $scope.properties.errorNoResults;
        } else {
          $scope.offerings.forEach(function(offering) {
            convertServerOfferingToClientViewOffering(LanguageService.getCurrentLanguage(), $scope, offering);
          });
        }
      });
    };
  }
]);

//Edit controller only available for authenticated users
angular.module('offerings').controller('OfferingsEditController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                                   'Authentication', 'Offerings', 'Socket', 'GeoService', 'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, Socket, GeoService, LanguageService) {

    // initialize all properties in the view (html)
    LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
      $scope.properties = translationList;
    });

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
      });
    });

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    $scope.messages = [];
    $scope.category = {};
    
    $scope.authentication = Authentication;
 
    // Ask for our current city+coordinates from Geo services
    geoGetCurrentLocation(GeoService, $scope, $http);

    // Update existing Offering
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringForm');
        return false;
      }

      geoValidateLocation($scope);

      var offering = $scope.offering;
      offering.category = getCategoryArray(this.category, 'others');
      offering.longitude = $scope.longitude;
      offering.latitude = $scope.latitude;
      offering.descriptionLanguage = LanguageService.getCurrentLanguage(); 
      var now = new Date(); 
      var whenDate = offering.when ? new Date(offering.when) : new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
      var newExpiry = new Date(whenDate);
      newExpiry.setMonth(newExpiry.getMonth()+1);
      offering.when = whenDate.toUTCString();
      offering.expiry = newExpiry.toUTCString();

      offering.$update(function () {
        $location.path('offerings/' + offering._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    
    // Find existing Offering
    $scope.findOne = function () {
      $scope.offering = Offerings.get({ 
        offeringId: $stateParams.offeringId 
      }, function () {
        $scope.offerType = $scope.offering.offerType;
        // set selected category checkbox of the to-edit-request/offer 
        var selectedCategory = {};
        $scope.offering.category.forEach(function(eachCategory) {
          selectedCategory[eachCategory] = true;
        });
        $scope.category = selectedCategory;
        convertServerOfferingUTCDateToLocal($scope.offering);
        // Convert to nicer date string for display
        $scope.offering.when = $scope.offering.when.toDateString();
      });
    };

  }
]);

//Offerings controller only available for authenticated users
angular.module('offerings').controller('OfferingsController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                               'Authentication', 'Offerings', 'Socket', 'GeoService', 'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, Socket, GeoService, LanguageService) {
    $scope.authentication = Authentication;

    // initialize all properties in the view (html)
    LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
      $scope.properties = translationList;
    });

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
      });
    });

    // Ask for our current city+coordinates from Geo services
    geoGetCurrentLocation(GeoService, $scope, $http);

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    $scope.messages = [];

    // Create new Offering
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringForm');

        return false;
      }

      geoValidateLocation($scope);

      // Create new Offering object
      var now = new Date(); 
      var whenDate = this.when ? new Date(this.when) : new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
      var newExpiry = new Date(whenDate);
      newExpiry.setMonth(newExpiry.getMonth()+1);
      var offering = new Offerings({
        when: whenDate.toUTCString(),
        expiry: newExpiry.toUTCString(),
        description: this.description,
        descriptionLanguage: LanguageService.getCurrentLanguage(),
        city: this.city,
             // mapping JSON array category from checkbox on webpage to String
        category: getCategoryArray(this.category, 'others'),
        longitude: $scope.longitude,
        latitude: $scope.latitude,
        offerType: this.offerType 
      });
      
      // Emit a 'offeringMessage' message event with the JSON offering object
      var message = {
        content: offering
      };
      Socket.emit('offeringMessage', message);

      // Redirect after save
      offering.$save(function (response) {
        $location.path('offerings/' + response._id);

        // Clear form fields
        $scope.when = '';
        $scope.expiry = '';
        $scope.updated = '';
        $scope.description = '';
        $scope.city = '';
        $scope.category = '';
        $scope.longitude = '';
        $scope.latitude = '';
        $scope.offerType = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Offering
    $scope.remove = function (offering) {
      if (offering) {
        offering.$remove();

        for (var i in $scope.offerings) {
          if ($scope.offerings[i] === offering) {
            $scope.offerings.splice(i, 1);
          }
        }
      } else {
        $scope.offering.$remove(function () {
          $location.path('offerings');
        });
      }
    };

    // Find a list of Offerings
    $scope.find = function () {
      $scope.offerings = Offerings.query({
      }, function () {
        $scope.offerings.forEach(function(offering) {
          convertServerOfferingToClientViewOffering(LanguageService.getCurrentLanguage(), $scope, offering);
        });
      });
    };

    // Find existing Offering
    $scope.findOne = function () {
      $scope.offering = Offerings.get({
        offeringId: $stateParams.offeringId
      }, function () {
        convertServerOfferingToClientViewOffering(LanguageService.getCurrentLanguage(), $scope, $scope.offering);
      });
    };

  }
]);
