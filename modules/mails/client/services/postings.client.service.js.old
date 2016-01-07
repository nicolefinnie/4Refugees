'use strict';

//Postings service used for communicating with the postings REST endpoints
angular.module('postings').factory('Postings', ['$resource',
  function ($resource) {
    return $resource('api/postings/:postingId', {
      postingId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

/**
 * Global postings service, it provides APIs defined below. 
 * 
 * To use this global service, make sure to include MailService in your controller.
 * The caller should ensure the user is authenticated prior to using this service.
 * 
 * For example, to check if unread postings are available, use the following code
 * in your controller:
 * 
 * @code 
  angular.module('core').controller('HeaderController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                         'Authentication', 'Menus', 'MailService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Menus, MailService) {

    MailService.checkForUnreadMail(function(unreadMailCount) {
      $scope.numUnreadMail = unreadMailCount;
    });
  }];
 * @endcode
 * 
 * The APIs currently offered are:
 * 
 * checkForUnreadMail($http, callback(unreadMailCount)); 
 * 
 **/
angular.module('postings').service('MailService', [ function () {
  this.checkForUnreadMail = function($http, callback) {
    var unreadMailUrl = '/api/postings?unread=true&countOnly=true';
    $http({
      method: 'GET',
      url: unreadMailUrl
    }).then(function successCallback(response) {
      var numUnread = 0;
      if ((response.status >= 200) && (response.status <= 299) && (response.data.length > 0) && response.data[0] && response.data[0].numResults) {
        numUnread = response.data[0].numResults;
      }
      callback(numUnread);
    }, function errorCallback(response) {
      console.log('MailService: Error \'' + response.status + '\' checking for new mail using \'' + unreadMailUrl + '\'');
      callback(false);
    });
  };
}
]);

