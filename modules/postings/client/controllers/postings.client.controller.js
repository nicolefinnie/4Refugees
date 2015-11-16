'use strict';

// Postings controller
angular.module('postings').controller('PostingsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Postings', 'Socket',
  function ($scope, $stateParams, $location, Authentication, Postings, Socket) {
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
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'postingForm');

        return false;
      }

      // Create new Posting object
      var posting = new Postings({
        title: this.title,
        content: this.content,
        unread: true,
        recipient: this.recipient,
        replyTo: this.replyTo,
        offeringId: this.offeringId,
      });

      // Emit a 'postingMessage' message event with the JSON posting object
      var message = {
        content: posting
      };
      Socket.emit('postingMessage', message);

      // Redirect after save
      posting.$save(function (response) {
        $location.path('postings/' + response._id);

        // Clear form fields
        $scope.title = '';
        $scope.content = '';
        $scope.replyTo = '';
        $scope.offeringId = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Posting
    $scope.remove = function (posting) {
      if (posting) {
        posting.$remove();

        for (var i in $scope.postings) {
          if ($scope.postings[i] === posting) {
            $scope.postings.splice(i, 1);
          }
        }
      } else {
        $scope.posting.$remove(function () {
          $location.path('postings');
        });
      }
    };

    // Update existing Posting 
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'postingForm');

        return false;
      }

      var posting = $scope.posting;

      posting.$update(function () {
        $location.path('postings/' + posting._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Postings
    $scope.find = function () {
      $scope.postings = Postings.query();
    };

    // Find existing Posting
    $scope.findOne = function () {
      $scope.posting = Postings.get({
        postingId: $stateParams.PostingId
      });
    };
  }
]);
