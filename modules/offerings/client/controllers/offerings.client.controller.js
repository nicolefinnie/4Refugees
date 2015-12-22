'use strict';


/** English Text.
 */
var FIND_HELP_EN = 'Find Help';
var NEED_HELP_EN = 'Need Help';
var OFFER_HELP_EN = 'Offer Help';
var SEARCH_NEED_EN = 'Search Needs';
var EDIT_OFFER_HELP_EN = 'Edit Offer';
var EDIT_NEED_HELP_EN = 'Edit Request';

var CATEGORY_EN = 'Category';
var JOB_TRAINING_EN = 'Job Training';
var LANGUAGE_COURSES_EN = 'Language Courses';
var MEDICAL_ASSISTANCE_EN = 'Medical Assistance';
var CHILDCARE_EN = 'Childcare';
var OTHERS_EN = 'Others';

var DESCRIPTION_EN = 'description';
var CITY_EN = 'city';
var SEARCH_RADIUS_EN = 'Search radius in ? km';
var WHEN_EN = 'when';
var OFFER_OTHERS_HELP_TEXT_EN = 'Or offer others your help!';
var TELL_OTHERS_NEEDS_TEXT_EN = 'Or tell others your needs!';
var FIND_OFFERS_TEXT_EN = 'Or find what offers are out there!';
var FIND_REQUESTS_TEXT_EN = 'Or find what helps are needed!';

var ADD_EN = 'Add';
var SEARCH_EN = 'Search';
var UPDATE_EN = 'Update';
var DELETE_EN = 'Delete';
var CONTACT_EN = 'Contact';


/** German Text.
 */
var FIND_HELP_DE = 'Angebote Suchen';
var NEED_HELP_DE = 'Hilfe Brauchen';
var OFFER_HELP_DE = 'Hilfe Anbieten';
var SEARCH_NEED_DE = 'Bedürfnisse Suchen';
var EDIT_OFFER_HELP_DE = 'Angebot ändern';
var EDIT_NEED_HELP_DE = 'Bedürfnis ändern';

var CATEGORY_DE = 'Kategorie';
var JOB_TRAINING_DE = 'Berufsausbildung';
var LANGUAGE_COURSES_DE = 'Sprachkurs';
var MEDICAL_ASSISTANCE_DE = 'Medizinische Versorgung';
var CHILDCARE_DE = 'Kinderbetreuung';
var OTHERS_DE = 'Sonstiges';

var DESCRIPTION_DE = 'Beschreibung';
var CITY_DE = 'Stadt';
var SEARCH_RADIUS_DE = 'Suchumkreis in ? km';
var WHEN_DE = 'Wann';

var OFFER_OTHERS_HELP_TEXT_DE = 'Oder den Anderen Hilfe anbieten!';
var TELL_OTHERS_NEEDS_TEXT_DE = 'Oder den Anderen Ihre Bedürfnisse mitteilen!';
var FIND_OFFERS_TEXT_DE = 'Oder Angebote von den Anderen suchen!';
var FIND_REQUESTS_TEXT_DE = 'Oder Bedürfnisse von den Anderen suchen!';

var ADD_DE = 'Hinzufügen';
var SEARCH_DE = 'Suchen';
var UPDATE_DE = 'Aktualisieren';
var DELETE_DE = 'Löschen';
var CONTACT_DE = 'Kontakt';


/** Arabic Text.
 */
var FIND_HELP_AR = 'البحث عن مساعدة';
var NEED_HELP_AR = 'احتاج مساعدة';

var OFFER_HELP_AR = 'عرض المساعدة';
var SEARCH_NEED_AR = 'احتياجات البحث';

var EDIT_OFFER_HELP_AR = 'تحرير عرض';
var EDIT_NEED_HELP_AR = 'تحرير طلب';

var CATEGORY_AR = 'فئة';
var JOB_TRAINING_AR = 'التدريب المهني';
var LANGUAGE_COURSES_AR = 'دورات اللغة';
var MEDICAL_ASSISTANCE_AR = 'المساعدة الطبية';
var CHILDCARE_AR = 'رعاية الأطفال';
var OTHERS_AR = 'آخرون';

var DESCRIPTION_AR = 'الوصف';
var CITY_AR = 'مدينة';
var SEARCH_RADIUS_AR = 'دائرة نصف قطرها ? كم البحث في';
var WHEN_AR = 'متى';

var OFFER_OTHERS_HELP_TEXT_AR = 'أو تقديم الآخرين لمساعدتكم!';
var TELL_OTHERS_NEEDS_TEXT_AR = 'أو تقول للآخرين الاحتياجات الخاصة بك!';
var FIND_OFFERS_TEXT_AR = 'أو تجد العروض هي هناك!';
var FIND_REQUESTS_TEXT_AR = 'أو البحث إذا كان يحتاج مساعدة الآخرين';

var ADD_AR = 'أدخل';
var SEARCH_AR = 'البحث عن';
var UPDATE_AR = 'تحديث';
var DELETE_AR = 'حذف';
var CONTACT_AR = 'اتصال';



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
      converted = converted + scope.jobTraining;
    } else if (cat === 'courses') {
      converted = converted + scope.languageCourses;
    } else if (cat === 'medical') {
      converted = converted + scope.medicalAssistance;
    } else if (cat === 'childcare') {
      converted = converted + scope.childCare;
    } else if (cat === 'others') {
      converted = converted + scope.others;
    }
  });
  return converted;
}

function geoUpdateLocation(position, scope) {
  var geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
  scope.latitude = position.coords.latitude;
  scope.longitude = position.coords.longitude;

  geocoder.geocode({ 'latLng': latlng }, function(results, status) {
    var city = 'Unknown';
    var country = 'Unknown';
    // Search through the returned results to find a reasonably good city + country to display
    // In general, the returned 'results' start from the most specific address, to the most general,
    // and since we only look for city + country (not street address, postal code, etc), we should be
    // able to find them from results[0].
    for (var x = 0, length_1 = results.length; x < length_1; x++){
      for (var y = 0, length_2 = results[x].address_components.length; y < length_2; y++){
        var type = results[x].address_components[y].types[0];
        if (type === 'locality'){
          city = results[x].address_components[y].long_name;
          if (country !== 'Unknown') {
            break;
          }
        } else if (type === 'country') {
          country = results[x].address_components[y].long_name;
          if (city !== 'Unknown') {
            break;
          }
        }
      }
      if (city !== 'Unknown' && country !== 'Unknown') {
        break;
      }
    }
    if (city === 'Unknown' || country === 'Unknown') {
      // according to Google map docs, results[4].formatted_address should provide
      // a relatively coarse address, for example, 'Stuttgart, Germany'.
      scope.city = results[4].formatted_address;
    } else {
      scope.city = city + ', ' + country;
    }
    scope.geoManual = false;
    scope.$apply();
  });
}

function geoUpdateLocationError(error, scope) {
  console.log('Google geolocation.getCurrentPosition() error: ' + error.code + ', ' + error.message);
  scope.geoManual = true;
  scope.geoSetupCityList();
  scope.$apply();
}

// Main geo locator entry, calls into google geo APIs to retrieve current
// location.  If geo-services are not available, allows for fallback of a
// drop-down list of pre-set cities to choose from with pre-set co-ordinates.
// TODO: Can this be turned into a service provided by a separate module???
function geoGetCurrentLocation(navigator, scope) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      geoUpdateLocation(position, scope);
    },
    function errorCallback(error) {
      geoUpdateLocationError(error, scope);
    },
      {
        // Note: Do NOT specify maximumAge to re-use previously-cached locations, since
        // that causes 'google not defined' errors when re-loading pages.
        timeout:10000        // 10-second timeout
      }
    );
  }
}

// Validate a suitable geoLocation was specified
function geoValidateLocation(scope) {
  var isValid = (scope.longitude !== undefined && scope.latitude !== undefined);
  // if google geo is not reachable or user does not allow it
  if (!isValid && scope.where)
  {
    isValid = true;
    scope.longitude = scope.where.longitude;
    scope.latitude = scope.where.latitude;
  }
  return isValid;
}

function setCommonAttributes($scope, $rootScope) {
  if ($rootScope.currentLanguage === 'en'){
    //buttons
    $scope.search = SEARCH_EN;
    $scope.add = ADD_EN;
    $scope.updateButton = UPDATE_EN;
    $scope.deleteButton = DELETE_EN;
    $scope.contact = CONTACT_EN;
    
    //categories
    $scope.categoryTitle = CATEGORY_EN;
    $scope.jobTraining = JOB_TRAINING_EN;
    $scope.languageCourses = LANGUAGE_COURSES_EN;
    $scope.medicalAssistance = MEDICAL_ASSISTANCE_EN;
    $scope.childCare = CHILDCARE_EN;
    $scope.others = OTHERS_EN;
    
    //text
    $scope.description = DESCRIPTION_EN;
    $scope.city = CITY_EN;
    $scope.searchRadius = SEARCH_RADIUS_EN;
    //$scope.when = WHEN_EN;
    
    $scope.offerOthersHelpText = OFFER_OTHERS_HELP_TEXT_EN;
    $scope.tellOthersNeedsText = TELL_OTHERS_NEEDS_TEXT_EN;
    $scope.findOtherOffersText = FIND_OFFERS_TEXT_EN;
    $scope.findOtherNeedsText = FIND_REQUESTS_TEXT_EN;
  } 
  else if ($rootScope.currentLanguage === 'de'){
    //buttons
    $scope.search = SEARCH_DE;
    $scope.add = ADD_DE;
    $scope.updateButton = UPDATE_DE;
    $scope.deleteButton = DELETE_DE;
    $scope.contact = CONTACT_DE;
    
    //categories
    $scope.categoryTitle = CATEGORY_DE;
    $scope.jobTraining = JOB_TRAINING_DE;
    $scope.languageCourses = LANGUAGE_COURSES_DE;
    $scope.medicalAssistance = MEDICAL_ASSISTANCE_DE;
    $scope.childCare = CHILDCARE_DE;
    $scope.others = OTHERS_DE;
    
    //text
    $scope.description = DESCRIPTION_DE;
    $scope.city = CITY_DE;
    $scope.searchRadius = SEARCH_RADIUS_DE;
    //$scope.when = WHEN_DE;
    
    $scope.offerOthersHelpText = OFFER_OTHERS_HELP_TEXT_DE;
    $scope.tellOthersNeedsText = TELL_OTHERS_NEEDS_TEXT_DE;
    $scope.findOtherOffersText = FIND_OFFERS_TEXT_DE;
    $scope.findOtherNeedsText = FIND_REQUESTS_TEXT_DE;
  } 
  else if ($rootScope.currentLanguage === 'ar'){
    //buttons
    $scope.search = SEARCH_AR;
    $scope.add = ADD_AR;
    $scope.updateButton = UPDATE_AR;
    $scope.deleteButton = DELETE_AR;
    $scope.contact = CONTACT_AR;
    
    //categories
    $scope.categoryTitle = CATEGORY_AR;
    $scope.jobTraining = JOB_TRAINING_AR;
    $scope.languageCourses = LANGUAGE_COURSES_AR;
    $scope.medicalAssistance = MEDICAL_ASSISTANCE_AR;
    $scope.childCare = CHILDCARE_AR;
    $scope.others = OTHERS_AR;

    //text
    $scope.description = DESCRIPTION_AR;
    $scope.city = CITY_AR;
    $scope.searchRadius = SEARCH_RADIUS_AR;
    //$scope.when = WHEN_AR;
    
    $scope.offerOthersHelpText = OFFER_OTHERS_HELP_TEXT_AR;
    $scope.tellOthersNeedsText = TELL_OTHERS_NEEDS_TEXT_AR;
    $scope.findOtherOffersText = FIND_OFFERS_TEXT_AR;
    $scope.findOtherNeedsText = FIND_REQUESTS_TEXT_AR;
  }
}

function setSearchOrAddOrEdit($scope, $rootScope, displayMode) {
  
  var searchNeedInCurrentLanguage = SEARCH_NEED_EN;
  var findHelpInCurrentLanguage = FIND_HELP_EN;
  var offerHelpInCurrentLanguage = OFFER_HELP_EN;
  var needHelpInCurrentLanguage = NEED_HELP_EN;
  var editOfferHelpInCurrentLanguage = EDIT_OFFER_HELP_EN;
  var editNeedHelpInCurrentLanguage = EDIT_NEED_HELP_EN;
  
  
  if ($rootScope.currentLanguage === 'en'){
    searchNeedInCurrentLanguage = SEARCH_NEED_EN;
    findHelpInCurrentLanguage = FIND_HELP_EN;
    offerHelpInCurrentLanguage = OFFER_HELP_EN;
    needHelpInCurrentLanguage = NEED_HELP_EN;
    editOfferHelpInCurrentLanguage = EDIT_OFFER_HELP_EN;
    editNeedHelpInCurrentLanguage = EDIT_NEED_HELP_EN;
  }
  else if ($rootScope.currentLanguage === 'de'){
    searchNeedInCurrentLanguage = SEARCH_NEED_DE;
    findHelpInCurrentLanguage = FIND_HELP_DE;
    offerHelpInCurrentLanguage = OFFER_HELP_DE;
    needHelpInCurrentLanguage = NEED_HELP_DE;
    editOfferHelpInCurrentLanguage = EDIT_OFFER_HELP_DE;
    editNeedHelpInCurrentLanguage = EDIT_NEED_HELP_DE;
    
  } else if ($rootScope.currentLanguage === 'ar'){
    searchNeedInCurrentLanguage = SEARCH_NEED_AR;
    findHelpInCurrentLanguage = FIND_HELP_AR;
    offerHelpInCurrentLanguage = OFFER_HELP_AR;
    needHelpInCurrentLanguage = NEED_HELP_AR;
    editOfferHelpInCurrentLanguage = EDIT_OFFER_HELP_AR;
    editNeedHelpInCurrentLanguage = EDIT_NEED_HELP_AR;
  }
  
  //Volunteer mode: determine the title to show, this mode search needs or create offer
  if ($scope.offerType === 'request' && displayMode === 'search') {
    $scope.showTitle = searchNeedInCurrentLanguage;
    $scope.createOffer = !$scope.createOffer;
  
  // Refugee mode: determine the title to show, this mode search help OR create request
  } 
  
  else if ($scope.offerType === 'offer' && displayMode === 'search'){
    $scope.showTitle = findHelpInCurrentLanguage;
    $scope.createRequest = !$scope.createRequest;
  }
  
  // Refugee mode: determine the title to show, this mode create request OR search offer
  else if ($scope.offerType === 'request' && displayMode === 'add') { 
    $scope.showTitle = needHelpInCurrentLanguage;
    $scope.searchOffer = !$scope.searchOffer;
   
  // volunteer mode: determine the title to show, this mode create offer OR search request
  } else if ($scope.offerType === 'offer' && displayMode === 'add'){
    $scope.showTitle = offerHelpInCurrentLanguage;
    $scope.searchRequest = !$scope.searchRequest;
  }

  // Refugee mode: determine the title to show, this mode create request OR search offer
  else if ($scope.offerType === 'request' && displayMode === 'edit') { 
    $scope.showTitle = editNeedHelpInCurrentLanguage;
    $scope.editOffer = !$scope.editOffer;
   
  // volunteer mode: determine the title to show, this mode create offer OR search request
  } else if ($scope.offerType === 'offer' && displayMode === 'edit'){
    $scope.showTitle = editOfferHelpInCurrentLanguage;
    $scope.editRequest = !$scope.editRequest;
  }
}

// Converts UTC date strings returned by server into locale Date objects
function convertServerOfferingUTCDateToLocal(offering) {
  offering.when = new Date(offering.when);
  offering.expiry = new Date(offering.expiry);
  offering.updated = new Date(offering.updated);
}

// Converts server offering JSON into client offering, for integration with views.
function convertServerOfferingToClientViewOffering($rootScope, $scope, offering) {
  offering.category = convertEnglishCategory(offering.category, $rootScope.currentLanguage, $scope);
  convertServerOfferingUTCDateToLocal(offering);
}

angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, Socket) {
    $scope.authentication = Authentication;
    
    setCommonAttributes($scope, $rootScope);
    setSearchOrAddOrEdit($scope, $rootScope, 'search');
    
    geoGetCurrentLocation(navigator, $scope);

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

      var geoIsValid = geoValidateLocation($scope);
      if (!geoIsValid) {
        console.log('Failed to determine Geo location.');
        // TODO: Cannot search without geo location, how to display error?
        return false;
      }

      // TODO: Should we re-direct to a new page? or render a new page?
      $scope.offerings = Offerings.query({
        description: this.description,
        descriptionLanguage: $rootScope.currentLanguage,
        city: this.city,
        longitude: this.longitude,
        latitude: this.latitude,
        radius: this.radius? this.radius:10,
        when: this.when,
             // mapping JSON array category from checkbox on webpage to String
        category: getCategoryArray(this.category, ''),
        offerType: this.offerType 
      }, function () {
        $scope.offerings.forEach(function(offering) {
          convertServerOfferingToClientViewOffering($rootScope, $scope, offering);
        });
      });
    };

    // Find existing Offering
//    $scope.findOne = function () {
//      $scope.offering = Offerings.get({
//        offeringId: $stateParams.offeringId
//      });
//    };

    $scope.geoSetupCityList = function() {
      return $http.get('/api/locations',{ cache: true }).then(function(response) {
        $scope.citylist = response.data;
      });
    };
  }
]);

//Edit controller only available for authenticated users
angular.module('offerings').controller('OfferingsEditController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, Socket) {

    setCommonAttributes($scope, $rootScope);
    setSearchOrAddOrEdit($scope, $rootScope, 'edit');

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    $scope.messages = [];
    $scope.category = {};
    
    $scope.authentication = Authentication;
 
    geoGetCurrentLocation(navigator, $scope);

    // Update existing Offering
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringForm');
        return false;
      }

      var geoIsValid = geoValidateLocation($scope);
      if (!geoIsValid) {
        console.log('Failed to determine Geo location.');
        // TODO: Cannot search without geo location, how to display error?
        return false;
      }

      var offering = $scope.offering;
      offering.category = getCategoryArray(this.category, 'others');
      offering.longitude = $scope.longitude;
      offering.latitude = $scope.latitude;
      offering.descriptionLanguage = $rootScope.currentLanguage; 
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
        setSearchOrAddOrEdit($scope, $rootScope, 'edit');

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

    $scope.geoSetupCityList = function() {
      return $http.get('/api/locations',{ cache: true }).then(function(response) {
        $scope.citylist = response.data;
      });
    };
  }
]);

//Offerings controller only available for authenticated users
angular.module('offerings').controller('OfferingsController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 'Authentication', 'Offerings', 'Socket',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Offerings, Socket) {
    $scope.authentication = Authentication;

    setCommonAttributes($scope, $rootScope);
    setSearchOrAddOrEdit($scope, $rootScope, 'add');

    geoGetCurrentLocation(navigator, $scope);

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

      var geoIsValid = geoValidateLocation($scope);
      if (!geoIsValid) {
        console.log('Failed to determine Geo location.');
        // TODO: Cannot search without geo location, how to display error?
        return false;
      }

      // Create new Offering object
      var now = new Date(); 
      var whenDate = this.when ? new Date(this.when) : new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
      var newExpiry = new Date(whenDate);
      newExpiry.setMonth(newExpiry.getMonth()+1);
      var offering = new Offerings({
        when: whenDate.toUTCString(),
        expiry: newExpiry.toUTCString(),
        description: this.description,
        descriptionLanguage: $rootScope.currentLanguage,
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
          convertServerOfferingToClientViewOffering($rootScope, $scope, offering);
        });
      });
    };

    // Find existing Offering
    $scope.findOne = function () {
      $scope.offering = Offerings.get({
        offeringId: $stateParams.offeringId
      }, function () {
        convertServerOfferingToClientViewOffering($rootScope, $scope, $scope.offering);
      });
    };

    $scope.geoSetupCityList = function() {
      return $http.get('/api/locations',{ cache: true }).then(function(response) {
        $scope.citylist = response.data;
      });
    };
  }
]);
