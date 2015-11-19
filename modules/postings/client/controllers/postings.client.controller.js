'use strict';

// Postings controller
angular.module('postings').controller('PostingsController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'Postings', 'Socket',
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
    $scope.create = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'postingForm');

        return false;
      }

      console.log('posting in ' + JSON.stringify(this.recipient[0]));

      // Create new Posting object
      var posting = new Postings({
        title: this.title,
        content: this.content,
        unread: true,
        recipient: this.recipient[0]._id,
        replyTo: this.replyTo,
        offeringId: this.offeringId,
      });

      // Emit a 'postingMessage' message event with the JSON posting object
      var message = {
        content: posting
      };
      Socket.emit('postingMessage', message);

      console.log('posting is ' + JSON.stringify(posting));

      // Redirect after save
      posting.$save(function (response) {
        $location.path('postings/' + response._id);

        // Clear form fields
        $scope.title = '';
        $scope.content = '';
        $scope.replyTo = '';
        $scope.offeringId = '';
        $scope.recipient = {};
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Posting
    $scope.removePosting = function (posting) {
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

    // ReplyTo existing Posting
    $scope.replyPosting = function (posting) {
      $scope.posting = posting;
      $('#modalReply').openModal();
    };


    $scope.modalDetails = function(posting){
      $scope.posting = posting;
      $('#modalDetails').openModal();
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

      // Emit a 'postingMessage' message event with an empty JSON posting object
      var message = {
        content : {
          recipient : Authentication.user._id
        }
      };
      Socket.emit('postingMessage', message);
    };

    // Find a list of new Postings
    $scope.findNew = function () {
      $scope.postings = Postings.query({ unread : true,reset : true });

      // Emit a 'postingMessage' message event with an empty JSON posting object
      var message = {
        content : {
          recipient : Authentication.user._id
        }
      };
      Socket.emit('postingMessage', message);
    };

    // Find existing Posting
    $scope.findOne = function () {
      $scope.posting = Postings.get({
        postingId: $stateParams.PostingId
      });
    };

    $scope.tags = [];

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
  }
]);
