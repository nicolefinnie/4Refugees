'use strict';

// Controller to create a mail/mail to the offering owner, from an offering contact request
angular.module('mails').controller('MailsCreateController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 'Authentication',
   'Mails', 'Socket', 'LanguageService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Mails, Socket, LanguageService) {
    $scope.authentication = Authentication;

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      $scope.initLanguage();
    });

    if ($stateParams.offeringId) {
      $scope.showTitle = 'Contact Offering Owner';
    } else {
      $scope.showTitle = 'Send new mail';
    }

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    // Create new Mail
    $scope.createMail = function (isValid) {
      $scope.error = null;

      // TODO: Need better validation of input fields.
      // TODO: Right now, user gets back 'success' message, even if some
      // TODO: fields are blank, i.e. they refreshed the page before sending.
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'mailForm');
        return false;
      }

      // Create new Mail object
      var mail = new Mails({
        title: this.title,
        content: this.content,
        unread: true,
        recipient: this.recipientId,
        replyTo: this.replyTo,
        offeringId: this.offeringId,
      });

      // Emit a 'mailMessage' message event with the JSON mail object
      var message = {
        content: mail
      };

      // Redirect after save
      mail.$save(function (response) {
        Socket.emit('mailMessage', message);
        $location.path('mails/createFromOfferSuccess');
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

