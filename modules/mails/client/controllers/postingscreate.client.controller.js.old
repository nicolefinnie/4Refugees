'use strict';

// Controller to create a posting/mail to the offering owner, from an offering contact request
angular.module('postings').controller('PostingsCreateController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'Postings', 'Socket',
  function ($scope, $http, $stateParams, $location, Authentication, Postings, Socket) {
    $scope.authentication = Authentication;

    if ($stateParams.offeringId) {
      $scope.showTitle = 'Contact Offering Owner';
    } else {
      $scope.showTitle = 'Send new mail';
    }

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    // Create new Posting
    $scope.createMail = function (isValid) {
      $scope.error = null;

      // TODO: Need better validation of input fields.
      // TODO: Right now, user gets back 'success' message, even if some
      // TODO: fields are blank, i.e. they refreshed the page before sending.
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

    // Fill in form based on input offering, user just has to click 'Send'
    $scope.prefillForm = function () {
      $scope.title = 'RE Your 4Refuge.es offering: ' + $stateParams.offeringDescription;
      $scope.replyTo = Authentication.user.email;
      $scope.content = 'Hello,\nI am interested in your offering.  Please e-mail me to discuss further.\n\nThank you,\n' + Authentication.user.displayName;
      $('#modalAskAboutOffering').openModal();
    };
  }
]);

