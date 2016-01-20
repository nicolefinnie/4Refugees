'use strict';
angular.module('users').config(function(tagsInputConfigProvider) {
  tagsInputConfigProvider.setDefaults('tagsInput', { placeholder: '' });
  tagsInputConfigProvider.setActiveInterpolation('tagsInput', { placeholder: true });
});

angular.module('users').controller('EditProfileController', ['$scope', '$http', '$location', 'Users', 'Authentication', '$log',
  function (ctrl, $http, $location, Users, Authentication, log) {
    ctrl.user = Authentication.user;
    
    log.info('The user object from Authentication.user:');
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
                  { tagID: '5', tagName: 'Others' }
      ];
      return tags.filter(function(tag) {
        return tag.tagName.toLowerCase().indexOf($query.toLowerCase()) !== -1;
      });
    };

    ctrl.languages = [
                  { langID: '1', langValue: 'العربية' },
                  { langID: '2', langValue: 'deutsch' },
                  { langID: '3', langValue: 'english' }
    ];
    
  }
]);
