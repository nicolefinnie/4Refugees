'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
  function ($resource) {
    return $resource('api/users', {}, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

//TODO this should be Users service
angular.module('users.admin').factory('Admin', ['$resource',
  function ($resource) {
    return $resource('api/users/:userId', {
      userId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

angular.module('users').service('UserService', ['$rootScope', '$http', '$location', 'Users', 'Authentication',
  function ($rootScope, $http, $location, Users, Authentication) {

    // Update a user profile
    this.updateUserProfile = function (ctrl, isValid) {
      ctrl.success = ctrl.error = null;
      if (!isValid) {
        ctrl.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }
      var user = new Users(Authentication.user);
      user.$update(function (response) {
        ctrl.$broadcast('show-errors-reset', 'userForm');
        ctrl.success = true;
        Authentication.user = response;
      }, function (response) {
        ctrl.error = response.data.message;
      });
    };

  }
]);