'use strict';
angular.module('users').config(function(tagsInputConfigProvider) {
  tagsInputConfigProvider.setDefaults('tagsInput', { placeholder: '' });
  tagsInputConfigProvider.setActiveInterpolation('tagsInput', { placeholder: true });
});

angular.module('users').controller('EditProfileController', ['$scope', '$http', '$location', 'Users', 'Authentication', '$log',
  function (ctrl, $http, $location, Users, Authentication, log) {
    ctrl.user = Authentication.user;
    
    log.info(ctrl.user);

    // Update a user profile
    ctrl.updateUserProfile = function (isValid) {
      ctrl.success = ctrl.error = null;
      if (!isValid) {
        ctrl.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var user = new Users(ctrl.user);

      user.$update(function (response) {
        ctrl.$broadcast('show-errors-reset', 'userForm');
        ctrl.success = true;
        Authentication.user = response;
      }, function (response) {
        ctrl.error = response.data.message;
      });
    };

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

    ctrl.loadLanguageTags = function($query) {
      var tags = [
                  { tagID: '1', tagName: 'English' },
                  { tagID: '2', tagName: 'German' },
                  { tagID: '3', tagName: 'Arabic' },
                  { tagID: '4', tagName: 'Farsi' },
                  { tagID: '5', tagName: 'French' },
                  { tagID: '6', tagName: 'Spanish' },
                  { tagID: '6', tagName: 'Italian' }
      ];
      return tags.filter(function(tag) {
        return tag.tagName.toLowerCase().indexOf($query.toLowerCase()) !== -1;
      });
    };

    
    ctrl.languages = [
                  { langID: 'ar', langValue: 'العربية' },
                  { langID: 'de', langValue: 'deutsch' },
                  { langID: 'en', langValue: 'english' }
    ];
    
  }
]);
