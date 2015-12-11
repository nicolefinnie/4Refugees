'use strict';

//English
var FIND_HELP_EN = 'Find Help';
var NEED_HELP_EN = 'Need Help';
var OFFER_HELP_EN = 'Offer Help';
var SEARCH_NEED_EN = 'Search Needs';

var CATEGORY_EN = 'Category';
var JOB_TRAINING_EN = 'Job Training';
var LANGUAGE_COURSES_EN = 'Language Courses';
var MEDICAL_ASSISTANCE_EN = 'Medical Assistance';
var CHILDCARE_EN = 'Childcare';
var OTHERS_EN = 'Others';

var ADD_EN = 'Add';
var SEARCH_EN = 'Search';

//German
var FIND_HELP_DE = 'Angebote Suchen';
var NEED_HELP_DE = 'Hilfe Brauchen';
var OFFER_HELP_DE = 'Hilfe Anbieten';
var SEARCH_NEED_DE = 'Bedürfnissen Suchen';

var CATEGORY_DE = 'Kategorie';
var JOB_TRAINING_DE = 'Berufsausbildung';
var LANGUAGE_COURSES_DE = 'Sprachkurs';
var MEDICAL_ASSISTANCE_DE = 'Medizinische Versorgung';
var CHILDCARE_DE = 'Kinderbetreuung';
var OTHERS_DE = 'Sonstiges';

var ADD_DE = 'Hinzufügen';
var SEARCH_DE = 'Suchen';

//Arabic
var FIND_HELP_AR = 'البحث عن مساعدة';
var NEED_HELP_AR = 'احتاج مساعدة';

var OFFER_HELP_AR = 'عرض المساعدة';
var SEARCH_NEED_AR = 'احتياجات البحث';

var CATEGORY_AR = 'فئة';
var JOB_TRAINING_AR = 'التدريب المهني';
var LANGUAGE_COURSES_AR = 'دورات اللغة';
var MEDICAL_ASSISTANCE_AR = 'المساعدة الطبية';
var CHILDCARE_AR = 'رعاية الأطفال';
var OTHERS_AR = 'آخرون';

var ADD_AR = 'أدخل';
var SEARCH_AR = 'البحث عن';


function geoSetupCityList($scope) {
  $scope.citylist = [
    { name: 'Stuttgart', latitude: 2, longitude: 3 },
    { name: 'Kön', latitude: 2, longitude: 3 },
    { name: 'Hamburg', latitude: 2, longitude: 3 },
    { name: 'Berlin', latitude: 2, longitude: 3 },
  ];
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
  //scope.city = 'Google geo error, try again later.';
  scope.geoManual = true;
  geoSetupCityList(scope);
  scope.$apply();
}

function setCommonAttributes($scope, $rootScope) {
  if ($rootScope.currentLanguage === 'en'){
    
    $scope.search = SEARCH_EN;
    $scope.add = ADD_EN;
    $scope.categoryTitle = CATEGORY_EN;
    $scope.jobTraining = JOB_TRAINING_EN;
    $scope.languageCourses = LANGUAGE_COURSES_EN;
    $scope.medicalAssistance = MEDICAL_ASSISTANCE_EN;
    $scope.childCare = CHILDCARE_EN;
    $scope.others = OTHERS_EN;

  } else if ($rootScope.currentLanguage === 'de'){
    $scope.search = SEARCH_DE;
    $scope.add = ADD_DE;
    $scope.categoryTitle = CATEGORY_DE;
    $scope.jobTraining = JOB_TRAINING_DE;
    $scope.languageCourses = LANGUAGE_COURSES_DE;
    $scope.medicalAssistance = MEDICAL_ASSISTANCE_DE;
    $scope.childCare = CHILDCARE_DE;
    $scope.others = OTHERS_DE;
  } else if ($rootScope.currentLanguage === 'ar'){
    $scope.search = SEARCH_AR;
    $scope.add = ADD_AR;
    $scope.categoryTitle = CATEGORY_AR;
    $scope.jobTraining = JOB_TRAINING_AR;
    $scope.languageCourses = LANGUAGE_COURSES_AR;
    $scope.medicalAssistance = MEDICAL_ASSISTANCE_AR;
    $scope.childCare = CHILDCARE_AR;
    $scope.others = OTHERS_AR;
  }
}

function setSearchOrAdd($scope, $rootScope, displayMode) {
  
  var searchNeedInCurrentLanguage = SEARCH_NEED_EN;
  var findHelpInCurrentLanguage = FIND_HELP_EN;
  var offerHelpInCurrentLanguage = OFFER_HELP_EN;
  var needHelpInCurrentLanguage = NEED_HELP_EN;
  
  
  if ($rootScope.currentLanguage === 'en'){
    searchNeedInCurrentLanguage = SEARCH_NEED_EN;
    findHelpInCurrentLanguage = FIND_HELP_EN;
    offerHelpInCurrentLanguage = OFFER_HELP_EN;
    needHelpInCurrentLanguage = NEED_HELP_EN;
  }
  else if ($rootScope.currentLanguage === 'de'){
    searchNeedInCurrentLanguage = SEARCH_NEED_DE;
    findHelpInCurrentLanguage = FIND_HELP_DE;
    offerHelpInCurrentLanguage = OFFER_HELP_DE;
    needHelpInCurrentLanguage = NEED_HELP_DE;
    
  } else if ($rootScope.currentLanguage === 'ar'){
    searchNeedInCurrentLanguage = SEARCH_NEED_AR;
    findHelpInCurrentLanguage = FIND_HELP_AR;
    offerHelpInCurrentLanguage = OFFER_HELP_AR;
    needHelpInCurrentLanguage = NEED_HELP_AR;
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
}

angular.module('offerings').controller('OfferingsPublicController', ['$scope', '$rootScope', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $rootScope, $stateParams, $location, Authentication, Offerings, Socket) {
    $scope.authentication = Authentication;
    
    setCommonAttributes($scope, $rootScope);
    setSearchOrAdd($scope, $rootScope, 'search');
    
    geoSetupCityList($scope);

    // get current location using Google GeoLocation services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        geoUpdateLocation(position, $scope);
      },
      function errorCallback(error) {
        geoUpdateLocationError(error, $scope);
      },
        {
          // Note: Do NOT specify maximumAge to re-use previously-cached locations, since
          // that causes 'google not defined' errors when re-loading pages.
          timeout:10000        // 10-second timeout
        }
      );
    }

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

      // only if google geo is not reachable or user does not allow it
      if (this.where)
      {
        $scope.longitude = $scope.where.longitude;
        $scope.latitude = $scope.where.latitude;
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
      });
    };

    // Find existing Offering
    $scope.findOne = function () {
      $scope.offering = Offerings.get({
        offeringId: $stateParams.offeringId
      });
    };

  }
]);

//Edit controller only available for authenticated users
angular.module('offerings').controller('OfferingsEditController', ['$scope', '$stateParams', '$location', 'Authentication', 'Offerings','Socket',
  function ($scope, $stateParams, $location, Authentication, Offerings, Socket) {
    
    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    geoSetupCityList($scope);

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    $scope.messages = [];
    $scope.category = {};
    
    $scope.authentication = Authentication;
 
    // get current location using Google GeoLocation services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        geoUpdateLocation(position, $scope);
      },
      function errorCallback(error) {
        geoUpdateLocationError(error, $scope);
      },
        {
          // Note: Do NOT specify maximumAge to re-use previously-cached locations, since
          // that causes 'google not defined' errors when re-loading pages.
          timeout:10000        // 10-second timeout
        }
      );
    }

    // Update existing Offering
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringForm');
        return false;
      }

      var offering = $scope.offering;

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
        //determine if it's edit request or offer
        if ($scope.offering.offerType === 0){
          $scope.showTitle = 'Edit Offer';
        } else {
          $scope.showTitle = 'Edit Request';
        }
       
        // set selected category checkbox of the to-edit-request/offer 
        var selectedCategory = {};
        $scope.offering.category.forEach(function(eachCategory) {
          selectedCategory[eachCategory] = true;
        });
        $scope.category = selectedCategory;
      });
    };

  }
]);

//Offerings controller only available for authenticated users
angular.module('offerings').controller('OfferingsController', ['$scope', '$rootScope', '$stateParams', '$location', 'Authentication', 'Offerings', 'Socket',
  function ($scope, $rootScope, $stateParams, $location, Authentication, Offerings, Socket) {
    $scope.authentication = Authentication;
    
    geoSetupCityList($scope);

    setCommonAttributes($scope, $rootScope);
    setSearchOrAdd($scope, $rootScope, 'add');
    
    
    // get current location using Google GeoLocation services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        geoUpdateLocation(position, $scope);
      },
      function errorCallback(error) {
        geoUpdateLocationError(error, $scope);
      },
        {
          // Note: Do NOT specify maximumAge to re-use previously-cached locations, since
          // that causes 'google not defined' errors when re-loading pages.
          timeout:10000        // 10-second timeout
        }
      );
    }

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

      // only if google geo is not reachable or user does not allow it
      if (this.where)
      {
        $scope.longitude = $scope.where.longitude;
        $scope.latitude = $scope.where.latitude;
      }
    
      // Create new Offering object
      var offering = new Offerings({
        when: this.when,
        updated: Date.now,
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

    // Update existing Offering
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'offeringForm');
        return false;
      }

      var offering = $scope.offering;

      offering.$update(function () {
        $location.path('offerings/' + offering._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Offerings
    $scope.find = function () {
      $scope.offerings = Offerings.query();
    };

    // Find existing Offering
    $scope.findOne = function () {
      $scope.offering = Offerings.get({
        offeringId: $stateParams.offeringId
      });
    };
  }
]);
