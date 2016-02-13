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

    $scope.initLanguage = function () {
      LanguageService.getPropertiesByViewName('mail', $http, function(translationList) {
        $scope.properties = translationList;
      });
    };

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      $scope.initLanguage();
    });

    $scope.initLanguage();

    // Create new Mail
    $scope.create = function (isValid, recipient, mailId, matchID, reportAdmin) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'mailForm');

        return false;
      }

      var index, len, recipient_id, reload_on_save, recipients, matchid,
        title = this.title,
        content = this.content,
        replyTo = mailId;

      // set up mass mail array - for replies turn single recipient into an array
      if (this.recipient && this.recipient[0]) {
        recipients = this.recipient;
        reload_on_save = true;
        matchid = this.matchId;
      }
      else {
        recipients = [recipient];
        reload_on_save = false;
        matchid = matchID;
      }

      len = recipients.length;
      
      recipients.forEach(function(recp, index) {

        // Create new Mail object
        var mail = new Mails({
          title: title,
          content: content,
          unread: true,
          reportAdmin: reportAdmin,
          recipient: recp._id,
          replyTo: replyTo,
          matchId: matchid
        });

        // Redirect after save
        mail.$save(function (response) {
          if (reload_on_save && (index === (len - 1))) {
            // TODO: This causes client exception when the admin user
            // sends a message to users.  Should there be a different
            // re-direct page for admin users?
            $location.path('mails/' + response._id);
            // Clear form fields
            $scope.replyTo = '';
            $scope.matchId = '';
            $scope.recipient = {};
            $scope.title = '';
            $scope.content = '';
          }
        }, function (errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      });
    };

    $scope.loadUsers = function($query) {
      var found = false;
      return $http.get('/api/users',{ cache: true }).then(function(response) {
        var users = response.data;
        return users.filter(function(users) {
          var match = users.username && users.username.toLowerCase().indexOf($query.toLowerCase()) !== -1;
          if (found) match = false;
          else if (match) found = true;
          return match;
        });
      });
    };

  }
]);

