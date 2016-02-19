'use strict';

// Global status codes (i.e. errors, search status), used by all controllers in this file.
// Note that the controller must call translateStatusCodes(properties) when first
// initialized, and whenever the current language is modified.
var StatusCodes = {
  NONE:                 { value: 0, message: '' }, 
  SEARCH_IN_PROGRESS:   { value: 1, message: '' }, 
  SEARCH_COMPLETE:      { value: 2, message: '' }, 
  SEARCH_NO_RESULTS:    { value: 3, message: '' }, 
  SEARCH_RETRY:         { value: 4, message: '' }, 
  ERROR_FROM_SERVER:    { value: 5, message: '' }, 
  ERROR_NO_CITY:        { value: 6, message: '' }, 
  ERROR_NO_DESCRIPTION: { value: 7, message: '' }
};

function translateStatusCodes(properties) {
  StatusCodes.SEARCH_IN_PROGRESS.message = properties.searchInProgress;
  StatusCodes.SEARCH_COMPLETE.message = properties.searchComplete;
  StatusCodes.SEARCH_NO_RESULTS.message = properties.searchNoResults;
  StatusCodes.SEARCH_RETRY.message = properties.searchRetry;
  StatusCodes.ERROR_FROM_SERVER.message = properties.errorFromServer;
  StatusCodes.ERROR_NO_CITY.message = properties.errorNoCity;
  StatusCodes.ERROR_NO_DESCRIPTION.message = properties.errorNoDescription;
}

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
function convertServerCategory(categories, lang, scope)
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

// Converts UTC date strings returned by server into locale Date objects
function convertServerOfferingUTCDateToLocal(offering) {
  offering.when = new Date(offering.whenString);
  offering.expiry = new Date(offering.expiryString);
  offering.updated = new Date(offering.updatedString);
}

// Converts server offering JSON into client offering, for integration with views.
function convertServerOfferingToClientViewOffering(LanguageService, $scope, offering) {
  // First time through, we cache the original un-translated category from the server
  if (!offering.serverCategory) {
    offering.serverCategory = offering.category;
  }
  offering.category = convertServerCategory(offering.serverCategory, LanguageService.getCurrentLanguage(), $scope);
  convertServerOfferingUTCDateToLocal(offering);
  // Initialize to generic/unknown description, then find proper language-specific description.
  offering.description = LanguageService.getTextForCurrentLanguage(offering.title);
  if (offering.details && offering.details.length > 0) {
    offering.descriptionDetails = LanguageService.getTextForCurrentLanguage(offering.details);
  }
  //FIXME code for demo to make it linkable
  if(offering.description.indexOf('https://') > -1){
    offering.descriptionLink = offering.description.substring(offering.description.indexOf('https://'), offering.description.length);
    offering.descriptionTitle = offering.description.substring(0, offering.description.indexOf('https://'));
  }
  else if(offering.description.indexOf('http://') > -1){
    offering.descriptionLink = offering.description.substring(offering.description.indexOf('http://'), offering.description.length);
    offering.descriptionTitle = offering.description.substring(0, offering.description.indexOf('http://'));
  }
}

// Validate a suitable geoLocation was specified
function validateGeoLocation(scope, offeringLocation) {
  if (offeringLocation.isInvalid) {
    console.log('Offering: Invalid location: ' + JSON.stringify(offeringLocation));
    scope.error = StatusCodes.ERROR_NO_CITY;
    throw new Error('Offering: Invalid location');
  }
}

// Validate a proper offering description was provided
function validateOfferingDescription(scope, description) {
  var isValid = (description !== undefined && description.length > 0);
  if (!isValid) {
    scope.error = StatusCodes.ERROR_NO_DESCRIPTION;
    throw new Error('Offering: Invalid description');
  }
}

// Controller handling offering searches
angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                                     'Authentication', 'Offerings', 'GeoSelector', 'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, GeoSelector, LanguageService) {
    $scope.authentication = Authentication;
    $rootScope.hideFooter = false;
    $scope.showDetails = false;
    $scope.searchStatus = StatusCodes.NONE;
    $scope.error = StatusCodes.NONE;
    $scope.geo = GeoSelector.getInitialState({ 'enableLocator': true, 'enableReverseGeocoder': false, 'enableList': true, 'enableManual': false });

    // initialize datepicker
    $('#searchWhen').pickadate({
      selectMonths: true, // Creates a dropdown to control month
      selectYears: 10, // Creates a dropdown of 10 years to control year
      format:'yyyy-mm-dd'
    });

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
        translateStatusCodes($scope.properties);
        GeoSelector.updateAutoTextResults($scope.geo, $scope.properties.geolocating, $scope.properties.geolocationSuccess);
        // Update results according to new language
        if ($scope.offerings) {
          $scope.offerings.forEach(function(offering) {
            convertServerOfferingToClientViewOffering(LanguageService, $scope, offering);
          });
        }
      });
    });

    $scope.profileModalDetails = function(currentProfile){
      $scope.activeProfile = currentProfile; 
      $('#volunteerProfile').openModal();
    };

    // Called when user clicks to update location
    $scope.toggleGeoLocation = function() {
      // We already tried the geo locator, so future toggles do not need to
      // worry about error handling.
      GeoSelector.toggleActive($scope.geo, $http);
    };

    // Search all offerings for the input criteria
    $scope.searchAll = function () {
      $scope.error = StatusCodes.NONE;

      var searchLocation = GeoSelector.getActiveLocation($scope.geo);
      validateGeoLocation($scope, searchLocation);

      var now = new Date(); 
      var whenDate = this.when ? new Date(this.when) : new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
      var curLanguage = LanguageService.getCurrentLanguage();
      var offeringDetails = (this.details && (this.details.length > 0)) ? [{ language: curLanguage, text: this.details }] : undefined;
      $scope.searchStatus = StatusCodes.SEARCH_IN_PROGRESS;
      $scope.offerings = Offerings.query({
        title: [{
          language: LanguageService.getCurrentLanguage(),
          text: this.description
        }],
        url: this.url,
        details: offeringDetails,
        city: searchLocation.city,
        longitude: searchLocation.lng,
        latitude: searchLocation.lat,
        radius: this.radius? this.radius:10,
        whenString: whenDate.toUTCString(),
             // mapping JSON array category from checkbox on webpage to String
        category: getCategoryArray(this.category, ''),
        offerType: this.offerType 
      }, function () {
        if ($scope.offerings.length < 1) {
          $scope.searchStatus = StatusCodes.SEARCH_NO_RESULTS;
        } else {
          $scope.searchStatus = StatusCodes.SEARCH_COMPLETE;
          $scope.offerings.forEach(function(offering) {
            convertServerOfferingToClientViewOffering(LanguageService, $scope, offering);
          });
        }
      }, function (errorResponse) {
        $scope.error = StatusCodes.ERROR_FROM_SERVER;
        $scope.searchStatus = StatusCodes.SEARCH_RETRY;
        console.log('Offering: error response is: ' + JSON.stringify(errorResponse));
      });
    };

    $scope.toggleAdvanced = function() {
      $scope.showDetails = !$scope.showDetails;
    };

    // Find existing Offering
    $scope.findOne = function() {
      $scope.offering = Offerings.get({
        offeringId: $stateParams.offeringId
      }, function () {
        convertServerOfferingToClientViewOffering(LanguageService, $scope, $scope.offering);
      });
    };

    $scope.initialize = function() {
      // initialize all properties in the view (html)
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
        translateStatusCodes($scope.properties);
        // Ask for our current city+coordinates from Geo services
        GeoSelector.activateLocator($scope.geo, $scope.properties.geolocating, $scope.properties.geolocationSuccess, function() {
          // only called if geo location failed, or if the location was returned
          // asynchronously and a digest round is required
          if (!$scope.geo.auto.supported) {
            GeoSelector.toggleActive($scope.geo, $http);
          } else {
            $scope.$apply();
          }
        });
      });
    };
  }
]);


//Offerings controller only available for authenticated users
angular.module('offerings').controller('OfferingsController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                               'Authentication', 'Offerings', 'GeoSelector', 'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, GeoSelector, LanguageService) {
    $scope.authentication = Authentication;
    $rootScope.hideFooter = false;
    $scope.offering = {};
    $scope.error = StatusCodes.NONE;
    $scope.geo = GeoSelector.getInitialState({ 'enableLocator': true, 'enableReverseGeocoder': true, 'enableList': true, 'enableManual': true });

    // initialize datepicker
    $('#when').pickadate({
      selectMonths: true, // Creates a dropdown to control month
      selectYears: 10, // Creates a dropdown of 10 years to control year
      format:'yyyy-mm-dd'
    });
    $('#expirationDate').pickadate({
      selectMonths: true, // Creates a dropdown to control month
      selectYears: 10, // Creates a dropdown of 10 years to control year
      format:'yyyy-mm-dd'
    });

    $scope.profileModalDetails = function(currentProfile){
      $scope.activeProfile = currentProfile; 
      $('#volunteerProfile').openModal();
    };
    
    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
        translateStatusCodes($scope.properties);
        GeoSelector.updateAutoTextResults($scope.geo, $scope.properties.geolocating, $scope.properties.geolocationSuccess);
        // Update results according to new language
        if ($scope.offerings) {
          $scope.offerings.forEach(function(offering) {
            convertServerOfferingToClientViewOffering(LanguageService, $scope, offering);
          });
        }
        if ($scope.offering && $scope.offering.serverCategory) {
          convertServerOfferingToClientViewOffering(LanguageService, $scope, $scope.offering);
        }
      });
    });

    $scope.cancelEdit = function() {
      // Re-direct back to their list of offerings
      $location.path('offerings');
    };

    // Called when user clicks to update location
    $scope.toggleGeoLocation = function() {
      GeoSelector.toggleActive($scope.geo, $http, function(digestInProgress) {
        // only called if geo location failed, or if the location was returned
        // asynchronously and a digest round is required
        if (!$scope.geo.auto.supported) {
          GeoSelector.toggleActive($scope.geo, $http);
        } else {
          $scope.$apply();
        }
      });
    };

    $scope.createOrUpdate = function() {
      $scope.error = StatusCodes.NONE;

      validateOfferingDescription($scope, this.description);

      var offeringLocation = GeoSelector.getActiveLocation($scope.geo);
      validateGeoLocation($scope, offeringLocation);

      // Update offering with data from the form
      var now = new Date(); 
      var whenDate = this.when ? new Date(this.when) : new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
      var expiryDate = this.expiry ? new Date(this.expiry) : new Date(whenDate);
      if (this.expiry === undefined) {
        expiryDate.setMonth(expiryDate.getMonth()+1);
      } 
      var curLanguage = LanguageService.getCurrentLanguage();
      $scope.offering.whenString = whenDate.toUTCString();
      $scope.offering.expiryString = expiryDate.toUTCString();
      $scope.offering.title = [{ language: curLanguage, text: this.description }];
      var offeringDetails = (this.details && (this.details.length > 0)) ? [{ language: curLanguage, text: this.details }] : undefined;
      $scope.offering.details = offeringDetails;
      $scope.offering.category = this.category ? [this.category] : ['others'];
      $scope.offering.city = offeringLocation.city;
      $scope.offering.longitude = offeringLocation.lng;
      $scope.offering.latitude = offeringLocation.lat;
      $scope.offering.offerType = this.offerType;

      if ($scope.offeringId === '0') {
        $scope.create();
      } else {
        $scope.update();
      }
    };

    // Create new Offering server request
    $scope.create = function () {
      // Redirect after save
      $scope.offering.$save(function (response) {
        $location.path('offerings');
        $scope.clearForm();
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Update existing Offering server request
    $scope.update = function () {
      $scope.offering.$update(function () {
        $location.path('offerings');
        $scope.clearForm();
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove single Offering
    $scope.removeSingleOffering = function (offering) {
      offering.$remove(function () {
        // Re-direct to their list of remaining offerings
        $location.path('offerings');
      });
    };

    // Remove one offering from within list of all my offerings
    $scope.removeOfferingFromList = function (offering) {
      offering.$remove();
      for (var i in $scope.offerings) {
        if ($scope.offerings[i] === offering) {
          $scope.offerings.splice(i, 1);
        }
      }
    };

    // Find all my offerings - init function for offerings.listMine
    $scope.findAllMine = function () {
      delete $scope.offering;
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
        translateStatusCodes($scope.properties);
        $scope.offerings = Offerings.query({
        }, function () {
          $scope.offerings.forEach(function(offering) {
            convertServerOfferingToClientViewOffering(LanguageService, $scope, offering);
          });
        });
      });
    };

    // Pre-fill form based on an existing offering - update codepath
    $scope.initializeFormFromOffering = function (offering) {
      $scope.offerType = offering.offerType;
      // each offer or request can only have one category
      if ($scope.offering.category.length > 0){
        $scope.category = $scope.offering.category[0];
      } else {
        $scope.category = 'others';
      }
      var whenDate = new Date(offering.whenString);
      var expiryDate = new Date(offering.expiryString);
      $scope.when = whenDate;
      $scope.expiry = expiryDate;
      $scope.description = LanguageService.getTextForCurrentLanguage(offering.title);
      if (offering.details && (offering.details.length > 0)) {
        $scope.details = LanguageService.getTextForCurrentLanguage(offering.details);
      }
      $scope.url = offering.url;
      // pre-fill geo-location with values in retrieved offering
      var manualLocation = {
        'city' : offering.city,
        'lat'  : offering.latitude,
        'lng'  : offering.longitude
      };
      GeoSelector.activateManual($scope.geo, manualLocation);
    };

    // Clear form fields, i.e. after a successful create or update
    $scope.clearForm = function () {
      delete $scope.category;
      delete $scope.description;
      delete $scope.url;
      delete $scope.details;
      delete $scope.when;
      delete $scope.expiry;
    };

    // Find existing Offering - init function for create+edit paths
    $scope.findOne = function () {
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
        translateStatusCodes($scope.properties);
        if ($stateParams.offeringId !== '0') {
          // Pre-populate form based on an existing offering, used when editing an offer
          $scope.offering = Offerings.get({
            offeringId: $stateParams.offeringId
          }, function () {
            $scope.initializeFormFromOffering($scope.offering);
          });
        } else {
          // Start off with an empty offering, used when creating a new offer
          $scope.offering = new Offerings({ });
          // Ask for our current city+coordinates from Geo services
          GeoSelector.activateLocator($scope.geo, $scope.properties.geolocating, $scope.properties.geolocationSuccess, function(digestInProgress) {
            // only called if geo location failed, or if the location was returned
            // asynchronously and a digest round is required
            if (!$scope.geo.auto.supported) {
              GeoSelector.toggleActive($scope.geo, $http);
            } else {
              $scope.$apply();
            }
          });
        }
      });
    };

  }
]);
