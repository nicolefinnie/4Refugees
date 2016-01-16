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

    // TODO load available tags here, already set ones should come from user object authentication.user later;
    // mocked data until I got a concept how to provide / manage the tags in the DB
    ctrl.loadTags = function($query) {
      var tags;
      return $http.get('/api/tags', { cache: true }).then(function(response) {
        tags = response.data;
        log.info('DEBUG - resonse.data content: ' + response.data);
        tags = [
                    { tagName: 'Job Training' },
                    { tagName: 'Language Courses' },
                    { tagName: 'Medical Assistance' },
                    { tagName: 'Childcare' },
                    { tagName: 'Others' }
        ];
        return tags.filter(function(tag) {
          return tag.tagName.toLowerCase().indexOf($query.toLowerCase()) !== -1;
        });
      });
    };
    
  }
]);
