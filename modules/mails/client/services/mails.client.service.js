'use strict';

//Mails service used for communicating with the mails REST endpoints
angular.module('mails').factory('Mails', ['$resource',
  function ($resource) {
    return $resource('api/mails/:mailId', {
      mailId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

/**
 * Global mails service, it provides APIs defined below. 
 * 
 * To use this global service, make sure to include MailService in your controller.
 * The caller should ensure the user is authenticated prior to using this service.
 * 
 * For example, to check if unread mails are available, use the following code
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
angular.module('mails').service('MailService', [ function () {
  this.checkForUnreadMail = function($http, callback) {
    var unreadMailUrl = '/api/mails?unread=true&countOnly=true';
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



angular.module('mails').directive('scroll', function($window, $document) {
  return {
    link: function(scope,element,attribute) {
      angular.element($window).on('scroll', function(e) {
        // Namespacing events with name of directive + event to avoid collisions
        // Note: I commented out the following because it was flooding the console with messages.
        //console.log('scrollTop: ' + $window.pageYOffset + '  doc.height: ' + $document.height() + '  window.height: ' + $window.innerHeight);
        if ($window.pageYOffset >= $document.height() - $window.innerHeight) {
          scope.find(5);
          scope.$apply();
        }
      });
    }
  };
});
