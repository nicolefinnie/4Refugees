'use strict';
/* global Materialize:false */

var ARABIC = 'العربية';
var ENGLISH = 'English';
var GERMAN = 'Deutsch';

//English
var SIGNIN_EN = 'Sign in';
var REGISTER_EN = 'Register';
var SIGNOUT_EN = 'Sign out';
var CHAT_EN = 'Chat';
var INMAIL_EN = 'InMail';
var LIST_MY_OFFERINGS_EN = 'List My Offerings';
var EDIT_PROFILE_EN = 'Edit Profile';
var CHANGE_PROFILE_PICTURE_EN = 'Change Profile Picture';
var CHANGE_PASSWORD_EN = 'Change Password';
var MANAGE_SOCIAL_ACCOUNTS_EN = 'Manage Social Accounts';

//German
var SIGNIN_DE = 'Anmelden';
var REGISTER_DE = 'Registieren';
var SIGNOUT_DE = 'Abmelden';
var CHAT_DE = 'Chat';
var INMAIL_DE = 'InMail';
var LIST_MY_OFFERINGS_DE = 'Meine Angebote Anzeigen';
var EDIT_PROFILE_DE = 'Profil Editieren';
var CHANGE_PROFILE_PICTURE_DE = 'Profilbild Ändern';
var CHANGE_PASSWORD_DE = 'Passwort Ändern';
var MANAGE_SOCIAL_ACCOUNTS_DE = 'Sozialkonten verwalten';


//Arabic
var SIGNIN_AR = 'تسجيل الدخول';
var REGISTER_AR = 'سجل';
var SIGNOUT_AR = 'تسجيل الخروج';
var CHAT_AR = 'دردشة';
var INMAIL_AR = 'البريد الإلكتروني';
var LIST_MY_OFFERINGS_AR = 'قائمة العروض بلدي';
var EDIT_PROFILE_AR = 'تعديل الملف الشخصي';
var CHANGE_PROFILE_PICTURE_AR = 'تغيير الصورة الشخصية';
var CHANGE_PASSWORD_AR = 'تغيير كلمة المرور';
var MANAGE_SOCIAL_ACCOUNTS_AR = 'إدارة الحسابات الاجتماعية';


//TODO ugly quick prototype, don't use $rootScope
angular.module('core').controller('HeaderController', ['$scope', '$rootScope', '$state', '$http', 'Authentication', 'Menus', 'Socket',
  function ($scope, $rootScope, $state, $http, Authentication, Menus, Socket) {
    // default language
    $rootScope.currentLanguage = 'en';
    // local variable to store the current language used by the home URL 
    var homeLanguage = $rootScope.currentLanguage;
    
    // Expose view variables 
    $scope.$state = $state;
    $scope.authentication = Authentication;
 
    // initial setup
    $scope.currentLanguage = ENGLISH;
    $scope.showArabic = true;
    $scope.showDeutsch = true;
    $scope.showEnglish = false;
    $scope.signIn = SIGNIN_EN;
    $scope.register = REGISTER_EN;
    $scope.signOut = SIGNOUT_EN;
    $scope.listMyOfferings = LIST_MY_OFFERINGS_EN;
    $scope.editProfile = EDIT_PROFILE_EN;
    $scope.changeProfilePicture = CHANGE_PROFILE_PICTURE_EN;
    $scope.changePassword = CHANGE_PASSWORD_EN;
    $scope.manageSocialAccounts = MANAGE_SOCIAL_ACCOUNTS_EN;
   
    
    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

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

    $scope.changeLanguage = function (language) {
      homeLanguage = language;
      $rootScope.currentLanguage = language;
      if (language === 'ar') {
        $scope.currentLanguage = ARABIC;
        $scope.showArabic = false;
        $scope.showEnglish = true;
        $scope.showDeutsch = true;
        $scope.signIn = SIGNIN_AR;
        $scope.register = REGISTER_AR;
        $scope.signOut = SIGNOUT_AR;
        $scope.listMyOfferings = LIST_MY_OFFERINGS_AR;
        $scope.editProfile = EDIT_PROFILE_AR;
        $scope.changeProfilePicture = CHANGE_PROFILE_PICTURE_AR;
        $scope.changePassword = CHANGE_PASSWORD_AR;
        $scope.manageSocialAccounts = MANAGE_SOCIAL_ACCOUNTS_AR;
       
      } else if (language === 'en') {
        $scope.currentLanguage = ENGLISH;
        $scope.showArabic = true;
        $scope.showEnglish = false;
        $scope.showDeutsch = true;
        $scope.signIn = SIGNIN_EN;
        $scope.register = REGISTER_EN;
        $scope.signOut = SIGNOUT_EN;
        $scope.listMyOfferings = LIST_MY_OFFERINGS_EN;
        $scope.editProfile = EDIT_PROFILE_EN;
        $scope.changeProfilePicture = CHANGE_PROFILE_PICTURE_EN;
        $scope.changePassword = CHANGE_PASSWORD_EN;
        $scope.manageSocialAccounts = MANAGE_SOCIAL_ACCOUNTS_EN;
       

      } else if (language === 'de') {
        $scope.currentLanguage = GERMAN;
        $scope.showArabic = true;
        $scope.showEnglish = true;
        $scope.showDeutsch = false;
        $scope.signIn = SIGNIN_DE;
        $scope.register = REGISTER_DE;
        $scope.signOut = SIGNOUT_DE;
        $scope.listMyOfferings = LIST_MY_OFFERINGS_DE;
        $scope.editProfile = EDIT_PROFILE_DE;
        $scope.changeProfilePicture = CHANGE_PROFILE_PICTURE_DE;
        $scope.changePassword = CHANGE_PASSWORD_DE;
        $scope.manageSocialAccounts = MANAGE_SOCIAL_ACCOUNTS_DE;
      }
    };

    // get home URL + current language setup
    $scope.getHomeURLWithCurrentLanguage = function() {
      return $state.href('home', {language: homeLanguage}); 
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
