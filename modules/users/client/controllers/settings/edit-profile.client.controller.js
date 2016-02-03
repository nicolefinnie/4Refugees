'use strict';
angular.module('users').config(function(tagsInputConfigProvider) {
  tagsInputConfigProvider.setDefaults('tagsInput', { placeholder: '' });
  tagsInputConfigProvider.setActiveInterpolation('tagsInput', { placeholder: true });
});

angular.module('users').controller('EditProfileController', ['$scope', '$rootScope', '$http', '$location', 'UserService',
  function (ctrl, $rootScope, $http, $location, userService) {
    
    // Update a user profile
    ctrl.updateUserProfile = function (isValid) {
      userService.updateUserProfile(ctrl, isValid);
    };

    // Tags for skills and interests
    ctrl.loadTags = function($query) {
      var tags = [
                  { tagID: '1', tagName: 'Job Training' },
                  { tagID: '2', tagName: 'Language Courses' },
                  { tagID: '3', tagName: 'Medical Assistance' },
                  { tagID: '4', tagName: 'Childcare' },
                  { tagID: '5', tagName: 'Others' },
                  { tagID: '6', tagName: 'Food Preparation' },
                  { tagID: '7', tagName: 'Customer Service' },
                  { tagID: '8', tagName: 'Hair Cutting' },
                  { tagID: '9', tagName: 'Plumbing' },
                  { tagID: '10', tagName: 'Mechanics' },
                  { tagID: '11', tagName: 'General Labour' },
                  { tagID: '12', tagName: 'Construction' }
      ];
      return tags.filter(function(tag) {
        return tag.tagName.toLowerCase().indexOf($query.toLowerCase()) !== -1;
      });
    };

    // Tags for the languages
    ctrl.loadLanguageTags = function($query) {
      var languageTags = [
                      { tagID: 'en', tagName: 'English' },
                      { tagID: 'de', tagName: 'Deutsch' },
                      { tagID: 'ar', tagName: 'العربية' },
                      { tagID: 'fa', tagName: 'فارسی' },
                      { tagID: 'fr', tagName: 'Français' },
                      { tagID: 'es', tagName: 'Español' },
                      { tagID: 'it', tagName: 'Italiano' }
      ];
      return languageTags.filter(function(tag) {
        return tag.tagName.toLowerCase().indexOf($query.toLowerCase()) !== -1;
      });
    };

  }
]);
