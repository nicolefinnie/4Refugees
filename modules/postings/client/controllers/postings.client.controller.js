'use strict';

// Controller to create a posting from an offering contact request
angular.module('postings').controller('PostingsCreateController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'Postings', 'Offerings', 'Socket',
  function ($scope, $http, $stateParams, $location, Authentication, Postings, Offerings, Socket) {
    $scope.authentication = Authentication;

    if ($stateParams.offeringId) {
      $scope.showTitle = 'Contact Offering Owner';
    } else {
      $scope.showTitle = 'Send new mail';
    }

    // Create new Posting
    $scope.create = function (isValid, recipient) {
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
        recipient: this.recipientId,
        replyTo: this.replyTo,
        offeringId: this.offeringId,
      });

      // Emit a 'postingMessage' message event with the JSON posting object
      var message = {
        content: posting
      };

      // Redirect after save
      posting.$save(function (response) {
        Socket.emit('postingMessage', message);
        $location.path('postings/createFromOfferSuccess');
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Lookup offering to pre-fill contact request form
    $scope.prefillForm = function () {
      $scope.offering = Offerings.get({ 
        offeringId: $stateParams.offeringId 
      }, function () {
        $scope.title = 'RE your 4Refuge.es offering: ' + $scope.offering.description;
        $scope.offeringId = $scope.offering._id;
        $scope.recipientName = $scope.offering.user.displayName;
        $scope.recipientId = $scope.offering.userId;
        $scope.replyTo = Authentication.user.email;
        $scope.content = 'Hello,\nI am interested in your offering.  Please e-mail me to discuss further.\n\nThank you,\n' + Authentication.user.displayName;
      });
    };
  }
]);


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
      $scope.postings = Postings.query({ reset : true }, function() {
        for(var i = 0,len = $scope.postings.length; i < len;i++) {
          $scope.postings[i].contentShort = $scope.postings[i].content.substr(0,30);
        }
      });

      // Emit a 'postingMessage' message event with an empty JSON posting object
      var message = {
        content : {
          recipient : Authentication.user._id
        }
      };
      Socket.emit('postingMessage', message);
    };

        // Add an event listener to the 'postingMessage' event and show new inMails for logged in users
    Socket.on('postingMessage', function (message) {

      if (message.content.recipient === Authentication.user._id) {
        if (message.content.title) {
          console.log('PostingController: Received new email');
          $scope.postings = Postings.query({ reset : false }, function() {
            for(var i = 0,len = $scope.postings.length; i < len;i++) {
              $scope.postings[i].contentShort = $scope.postings[i].content.substr(0,30);
            }
          });
          //message.content.contentShort = message.content.content.substr(0,30);
          //$scope.postings.unshift(message.content);
        }
        else {
          console.log('PostingController: Received remove email');
        }
      }
      else
      {
        console.log('PostingController: Somebody else received email ' + JSON.stringify(message.content.recipient));
      }

    });


    // Find a list of new Postings
    $scope.findNew = function () {
      $scope.postings = Postings.query({ unread : true,reset : true }, function() {
        for(var i = 0,len = $scope.postings.length; i < len;i++) {
          $scope.postings[i].contentShort = $scope.postings[i].content.substr(0,30);
        }
      });

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
