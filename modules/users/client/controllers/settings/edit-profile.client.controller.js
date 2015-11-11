'use strict';

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
    // TODO provide API to store and retrieve tags
    // TODO extend user object with tags and aboutMe section
    // TODO extend API to safe those new fields
    ctrl.user.tags = [{ tagName: '\"samurai on the toilet\" - by takeshi kitano (1970)' },
                      { tagName: '(>_<)' },
                      { tagName: '(o_o)' },
                      { tagName: '(O_O)' },
                      { tagName: '(^_^)' }
                     ];

    // mocked data until I figured out how to create APIs
    ctrl.loadTags = function($query) {
      return $http.get('/public/lib/tags.json', { cache: true }).then(function(response) {
//          var tags = response.data;
        log.info('DEBUG - resonse.data content: ' + response.data);
        var tags = [
                    { tagName: 'sleepy' },
                    { tagName: 'super sleepy' },
                    { tagName: 'Translation' },
                    { tagName: 'Offices' },
                    { tagName: 'Politics' },
                    { tagName: 'Toys' },
                    { tagName: 'Food' },
                    { tagName: 'Calculation' },
                    { tagName: 'Stuff' },
                    { tagName: 'Cheese' },
                    { tagName: 'Sports' },
                    { tagName: 'Smelly feet' },
                    { tagName: 'Chocolate' },
                    { tagName: 'Fun' },
                    { tagName: 'Sleep' },
                    { tagName: 'SomeSleep1' },
                    { tagName: 'SleepDeprivedProgrammer' },
                    { tagName: 'PowerSleep' }
        ];
        return tags.filter(function(tag) {
          return tag.tagName.toLowerCase().indexOf($query.toLowerCase()) !== -1;
        });
      });
    };
    
    ctrl.user.aboutMe = "stuff \n ss This is some awesome stuff to blabla about me blabla sutff thing \n safewf fea \t <sdf s\t ";
  }
]);
