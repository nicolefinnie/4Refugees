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

    /* We update the user profile using angular $update function, in the first case (successful) 
    * we call the callback function and return a user profile with no error response. 
    * In the second case (error), we return an error response without a user profile.*/
    this.updateUserProfile = function (newUserProfile, callback) {
      var user = new Users(newUserProfile);
      user.$update(function (userProfile) {
        Authentication.user = userProfile;
        callback(null, userProfile);
      }, function (errorResponse) {
        callback(errorResponse, null);
      });
    };

  }
]);