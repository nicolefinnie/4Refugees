'use strict';

// Controller to create a mail/mail to the offering owner, from an offering contact request
angular.module('mails').controller('MailsCreateController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 'Authentication',
   'Mails', 'Socket', 'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Mails, Socket, LanguageService) {
    $scope.authentication = Authentication;

    // Create new Mail
    $scope.createMail = function () {
      // Create new Mail object
      var mail = new Mails({
        title: this.title,
        content: this.content,
        unread: true,
        reportAdmin: false,
        recipient: this.recipientId,
        replyTo: null,
        matchId: this.matchId,
      });

      // Send mail and display success/error message
      mail.$save(function (response) {
        $scope.showTitle = $scope.properties.contactSuccess;
      }, function (errorResponse) {
        console.log('MailsCreateController: error response is: ' + JSON.stringify(errorResponse));
        $scope.showTitle = $scope.properties.errorFromServer;
      });
    };

    // Fill in form based on input offering/match, and send mail
    $scope.sendGeneratedMail = function () {
      LanguageService.getPropertiesByViewName('mail', $http, function(translationList) {
        $scope.properties = translationList;
        $scope.showTitle = $scope.properties.contactInProgress;
        $scope.createMail();
      });
    };
  }
]);

