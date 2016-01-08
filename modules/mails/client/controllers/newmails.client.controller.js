'use strict';

// New Mails controller - allows to reply (and also admins to send "unsolicited" emails)
angular.module('mails').controller('NewMailsController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 'Authentication',
    'Mails', 'Socket', 'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Mails, Socket,LanguageService) {
    $scope.authentication = Authentication;

    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      $scope.initLanguage();
    });

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    // Create new Mail
    $scope.create = function (isValid, recipient, offeringID) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'mailForm');

        return false;
      }

      var recipient_id, reload_on_save;

      if (this.recipient && this.recipient[0]) {
        console.log('mail for ' + JSON.stringify(this.recipient[0]));
        recipient_id = this.recipient[0]._id;
        reload_on_save = true;
      }
      else {
        console.log('reply to ' + JSON.stringify(recipient));
        recipient_id = recipient._id;
        reload_on_save = false;
      }

      // Create new Mail object
      var mail = new Mails({
        title: this.title,
        content: this.content,
        unread: true,
        recipient: recipient_id,
        replyTo: this.replyTo,
        offeringId: (reload_on_save) ? this.offeringId : offeringID
      });

      // Emit a 'mailMessage' message event with the JSON mail object
      var message = {
        content: mail
      };
      //Socket.emit('mailMessage', message);

      console.log('mail is ' + JSON.stringify(mail));

      // Redirect after save
      mail.$save(function (response) {
        Socket.emit('mailMessage', message);

        if (reload_on_save) {
          // TODO: This causes client exception when the admin user
          // sends a message to users.  Should there be a different
          // re-direct page for admin users?
          $location.path('mails/' + response._id);
          // Clear form fields
          $scope.replyTo = '';
          $scope.offeringId = '';
          $scope.recipient = {};
        }
        $scope.title = '';
        $scope.content = '';
        $scope.authentication = Authentication;

      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.loadUsers = function($query) {
      var found = false;
      //console.log("load users for " + $query);
      return $http.get('/api/users',{ cache: true }).then(function(response) {
        var users = response.data;
        return users.filter(function(users) {
          var match = users.username && users.username.toLowerCase().indexOf($query.toLowerCase()) !== -1;
          if (found) match = false;
          else if (match) found = true;
          //console.log("load user " + users.username + "   " + found + "  " + match);
          return match;
        });
      });
    };

    $scope.initLanguage = function () {
      LanguageService.getPropertiesByViewName('mail', $http, function(translationList) {
        $scope.properties = translationList;
        LanguageService.getPropertiesByViewName('offering', $http, function(translationListO) {
          $scope.offeringproperties = translationListO;
        });
      });
    };
  }
]);

