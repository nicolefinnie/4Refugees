'use strict';

// Postings controller
angular.module('postings').controller('PostingsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Postings',
  function ($scope, $stateParams, $location, Authentication, Postings) {
    $scope.authentication = Authentication;

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
        replyTo: this.replyTo,
        offeringId: this.offeringId,
      });

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
