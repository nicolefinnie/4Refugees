'use strict';
/* global Materialize:false */

var ARABIC = 'العربية';
var ENGLISH = 'English';
var GERMAN = 'Deutsch';

//English
var SIGNIN_EN = 'Sign in';
var REGISTER_EN = 'Register';
var SIGNOUT_EN = 'Sign out';


var LIST_MY_OFFERINGS_EN = 'Offerings';
var PROFILE_EN = 'Profile';
var EDIT_PROFILE_EN = 'Edit Profile';
var CHANGE_PROFILE_PICTURE_EN = 'Change Profile Picture';
var CHANGE_PASSWORD_EN = 'Change Password';
var MANAGE_SOCIAL_ACCOUNTS_EN = 'Manage Social Accounts';

//German
var SIGNIN_DE = 'Anmelden';
var REGISTER_DE = 'Registieren';
var SIGNOUT_DE = 'Abmelden';

var LIST_MY_OFFERINGS_DE = 'Angebote';
var PROFILE_DE = 'Profil';
var EDIT_PROFILE_DE = 'Profil Editieren';
var CHANGE_PROFILE_PICTURE_DE = 'Profilbild Ändern';
var CHANGE_PASSWORD_DE = 'Passwort Ändern';
var MANAGE_SOCIAL_ACCOUNTS_DE = 'Sozialkonten verwalten';


//Arabic
var SIGNIN_AR = 'تسجيل الدخول';
var REGISTER_AR = 'سجل';
var SIGNOUT_AR = 'تسجيل الخروج';


var LIST_MY_OFFERINGS_AR = 'عروض';
var PROFILE_AR = 'مظهر جانبي';
var EDIT_PROFILE_AR = 'تعديل الملف الشخصي';
var CHANGE_PROFILE_PICTURE_AR = 'تغيير الصورة الشخصية';
var CHANGE_PASSWORD_AR = 'تغيير كلمة المرور';
var MANAGE_SOCIAL_ACCOUNTS_AR = 'إدارة الحسابات الاجتماعية';


function refreshHeaderInCurrentLanguage($scope, language){
  if (language === 'ar') {
    $scope.currentLanguageShownInHeader = ARABIC;
    $scope.signIn = SIGNIN_AR;
    $scope.register = REGISTER_AR;
    $scope.signOut = SIGNOUT_AR;
    $scope.listMyOfferings = LIST_MY_OFFERINGS_AR;
    $scope.profile = PROFILE_AR;
    $scope.editProfile = EDIT_PROFILE_AR;
    $scope.changeProfilePicture = CHANGE_PROFILE_PICTURE_AR;
    $scope.changePassword = CHANGE_PASSWORD_AR;
    $scope.manageSocialAccounts = MANAGE_SOCIAL_ACCOUNTS_AR;
  } 
  else if (language === 'en') {
    $scope.currentLanguageShownInHeader = ENGLISH;
    $scope.signIn = SIGNIN_EN;
    $scope.register = REGISTER_EN;
    $scope.signOut = SIGNOUT_EN;
    $scope.listMyOfferings = LIST_MY_OFFERINGS_EN;
    $scope.profile = PROFILE_EN;
    $scope.editProfile = EDIT_PROFILE_EN;
    $scope.changeProfilePicture = CHANGE_PROFILE_PICTURE_EN;
    $scope.changePassword = CHANGE_PASSWORD_EN;
    $scope.manageSocialAccounts = MANAGE_SOCIAL_ACCOUNTS_EN;
  } 
  else if (language === 'de') {
    $scope.currentLanguageShownInHeader = GERMAN;
    $scope.signIn = SIGNIN_DE;
    $scope.register = REGISTER_DE;
    $scope.signOut = SIGNOUT_DE;
    $scope.listMyOfferings = LIST_MY_OFFERINGS_DE;
    $scope.profile = PROFILE_DE;
    $scope.editProfile = EDIT_PROFILE_DE;
    $scope.changeProfilePicture = CHANGE_PROFILE_PICTURE_DE;
    $scope.changePassword = CHANGE_PASSWORD_DE;
    $scope.manageSocialAccounts = MANAGE_SOCIAL_ACCOUNTS_DE;
  }
}


function refreshLanguageDropdownMenu($scope, language){
  if (language === 'ar') {
    $scope.arabicSelected = true;
    $scope.englishSelected = false;
    $scope.germanSelected = false;

  } 
  else if (language === 'en') {
    $scope.arabicSelected = false;
    $scope.englishSelected = true;
    $scope.germanSelected = false;
  } 
  else if (language === 'de') {
    $scope.arabicSelected = false;
    $scope.englishSelected = false;
    $scope.germanSelected = true;
  }  
}

angular.module('core').controller('HeaderController', ['$scope', '$rootScope', '$state', '$http', 'Authentication', 'Menus', 'Socket',
  function ($scope, $rootScope, $state, $http, Authentication, Menus, Socket) {
    // default language
    $rootScope.currentLanguage = 'en';
    
    // Expose view variables 
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // initialize the header language and dropdown menu in English
    refreshHeaderInCurrentLanguage($scope, $rootScope.currentLanguage);
    refreshLanguageDropdownMenu($scope, $rootScope.currentLanguage);
    
    // language change clicked
    $scope.changeLanguage = function (language) {

      $rootScope.currentLanguage = language;
      // refresh header
      refreshHeaderInCurrentLanguage($scope, language);
      // refresh the dropdown menu if the language changes
      refreshLanguageDropdownMenu($scope, language);
      // broadcast this language change to HomeController to refresh
      $rootScope.$broadcast('tellHomeToChangeLanguage');
      
    };

    //TODO remove the dynamically added menu 
    //$scope.menu = Menus.getMenu('topbar');
    $scope.hasPostingBadge = false;

    // set 'new' badge to InMail if there is unread mail for me
    if (Authentication.user) {
      $http.get('/api/postings?unread=true',{ cache: true }).then(function(response) {
        var postings;
        if (response.statusCode >= 200 || response.statusCode <= 299) {
          postings = response.data;
          if (postings.length > -1) $scope.hasPostingBadge = true;
        }
      });
    }

    $scope.checkAdminRole = function() {
      if (Authentication) {
        if (Authentication.user) {
          return (Authentication.user.roles.indexOf('admin') > -1);
        }
      }
      return false;
    };
        
    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });

    // Make sure the Socket is connected
    if (!Socket.socket) {
      Socket.connect();
    }

    // Add an event listener to the 'postingMessage' event and show new inMails for logged in users
    Socket.on('postingMessage', function (message) {

      // TODO - do not check against the SENDER userName
      if (message.content.recipient === Authentication.user._id) {
        if (message.content.title) {
          console.log('Received new email');
          $scope.hasPostingBadge = true;
        }
        else {
          console.log('Received remove email');
          $scope.hasPostingBadge = false;
        }
      }
      else
      {
        console.log('Somebody else received email');
      }

    });
  }
]);

angular.module('core').controller('HeaderNewOfferingsController', ['$scope', 'Authentication', 'Socket',
  function ($scope, Authentication, Socket) {
    $scope.authentication = Authentication;

    // Make sure the Socket is connected
    if (!Socket.socket) {
      Socket.connect();
    }

    // Add an event listener to the 'offeringMessage' event and toast logged in users
    Socket.on('offeringMessage', function (message) {
      var toastContent = '<span>new ' + message.content.category;

      if (message.content.offerType === 0) {
        toastContent = toastContent + ' request: ';
      } else {
        toastContent = toastContent + ' offering: ';
      }

      toastContent = toastContent + 
        message.content.description.substr(0,10) + ' - posted by user ' + message.username.substr(0,20);

      console.log('new stuff ' + toastContent);

      // only post users logged in
      if (Authentication.user) {
        Materialize.toast(toastContent, 5000);
      }
    });

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function () {
      Socket.removeListener('offeringMessage');
    });
  }
]);
