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
  offering.when = new Date(offering.whenString);
  offering.expiry = new Date(offering.expiryString);
  offering.updated = new Date(offering.updatedString);
}

// Converts server offering JSON into client offering, for integration with views.
function convertServerOfferingToClientViewOffering(language, $scope, offering) {
  offering.category = convertEnglishCategory(offering.category, language, $scope);
  offering.offerType = convertEnglishOfferType(offering.offerType, $scope);
  convertServerOfferingUTCDateToLocal(offering);
}

// Validate a suitable geoLocation was specified
function validateGeoLocation(scope, offeringLocation) {
  if (offeringLocation.isInvalid) {
    console.log('Offering: Invalid location: ' + JSON.stringify(offeringLocation));
    scope.error = scope.properties.errorNoCity;
    throw new Error('Offering: Invalid location');
  }
}

// Validate a proper offering description was provided
function validateOfferingDescription(scope, offering) {
  var isValid = (offering.description !== undefined && offering.description.length > 0);
  if (!isValid) {
    scope.error = scope.properties.errorNoDescription;
    throw new Error('Offering: Invalid description');
  }
}


// Controller handling offering searches
angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                                     'Authentication', 'Offerings', 'GeoSelector', 'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, GeoSelector, LanguageService) {
    $scope.authentication = Authentication;

    $scope.showDetails = false;
    $scope.searchStatus = null;
    $scope.geo = GeoSelector.getInitialState({ 'enableLocator': true, 'enableReverseGeocoder': false, 'enableList': true, 'enableManual': false });

    // initialize datepicker
    $('#searchWhen').pickadate({
      selectMonths: true, // Creates a dropdown to control month
      selectYears: 10, // Creates a dropdown of 10 years to control year
      format:'yyyy-mm-dd'
    });

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      $scope.initialize();
    });

    $scope.profileModalDetails = function(){
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
      $scope.error = null;

      var searchLocation = GeoSelector.getActiveLocation($scope.geo);
      validateGeoLocation($scope, searchLocation);

      var now = new Date(); 
      var whenDate = this.when ? new Date(this.when) : new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
      $scope.searchStatus = $scope.properties.searchInProgress;
      // TODO: Should we re-direct to a new page? or render a new page?
      $scope.offerings = Offerings.query({
        description: this.description,
        descriptionLanguage: LanguageService.getCurrentLanguage(),
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
          $scope.searchStatus = $scope.properties.searchNoResults;
        } else {
          $scope.searchStatus = $scope.properties.searchComplete;
          $scope.offerings.forEach(function(offering) {
            convertServerOfferingToClientViewOffering(LanguageService.getCurrentLanguage(), $scope, offering);
          });
        }
      }, function (errorResponse) {
        $scope.error = $scope.properties.errorFromServer;
        $scope.searchStatus = $scope.properties.searchRetry;
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
        convertServerOfferingToClientViewOffering(LanguageService.getCurrentLanguage(), $scope, $scope.offering);
      });
    };

    $scope.initialize = function() {
      // initialize all properties in the view (html)
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
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

    $scope.offering = {};
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

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      $scope.initLanguage();
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
      $scope.error = null;

      $scope.offering.description = this.description;
      validateOfferingDescription($scope, $scope.offering);

      var offeringLocation = GeoSelector.getActiveLocation($scope.geo);
      validateGeoLocation($scope, offeringLocation);

      // Update offering with data from the form
      var now = new Date(); 
      var whenDate = this.when ? new Date(this.when) : new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
      var expiryDate = this.expiry ? new Date(this.expiry) : new Date(whenDate);
      if (this.expiry === undefined) {
        expiryDate.setMonth(expiryDate.getMonth()+1);
      } 
      $scope.offering.whenString = whenDate.toUTCString();
      $scope.offering.expiryString = expiryDate.toUTCString();
      $scope.offering.description = this.description;
      $scope.offering.descriptionLanguage = LanguageService.getCurrentLanguage();
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

    $scope.initLanguage = function () {
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
      });
    };

    // Find all my offerings - init function for offerings.listMine
    $scope.findAllMine = function () {
      delete $scope.offering;
      $scope.initLanguage();
      $scope.offerings = Offerings.query({
      }, function () {
        $scope.offerings.forEach(function(offering) {
          convertServerOfferingToClientViewOffering(LanguageService.getCurrentLanguage(), $scope, offering);
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
      $scope.description = offering.description;
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
      delete $scope.when;
      delete $scope.expiry;
    };

    // Find existing Offering - init function for create+edit paths
    $scope.findOne = function () {
      LanguageService.getPropertiesByViewName('offering', $http, function(translationList) {
        $scope.properties = translationList;
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
