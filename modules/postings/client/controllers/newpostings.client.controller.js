'use strict';

// New Postings controller - allows admin to send email
angular.module('postings').controller('NewPostingsController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'Postings', 'Socket',
  function ($scope, $http, $stateParams, $location, Authentication, Postings, Socket) {
    $scope.authentication = Authentication;

    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    // Create new Posting
    $scope.create = function (isValid, recipient) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'postingForm');

        return false;
      }

      var recipient_id, reload_on_save;

      if (this.recipient && this.recipient[0]) {
        console.log('posting for ' + JSON.stringify(this.recipient[0]));
        recipient_id = this.recipient[0]._id;
        reload_on_save = true;
      }
      else {
        console.log('reply to ' + JSON.stringify(recipient));
        recipient_id = recipient._id;
        reload_on_save = false;
      }

      // Create new Posting object
      var posting = new Postings({
        title: this.title,
        content: this.content,
        unread: true,
        recipient: recipient_id,
        replyTo: this.replyTo,
        offeringId: this.offeringId,
      });

      // Emit a 'postingMessage' message event with the JSON posting object
      var message = {
        content: posting
      };
      //Socket.emit('postingMessage', message);

      console.log('posting is ' + JSON.stringify(posting));

      // Redirect after save
      posting.$save(function (response) {
        Socket.emit('postingMessage', message);

        if (reload_on_save) {
          $location.path('postings/' + response._id);
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
  }
]);

