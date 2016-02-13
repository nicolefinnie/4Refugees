'use strict';

// Mails controller - handles listing and replies etc.
angular.module('mails').controller('MailsController', ['$scope', '$rootScope', '$window', '$http', '$stateParams', '$location',
     'Authentication', 'Mails', 'LanguageService',
  function ($scope, $rootScope, $window, $http, $stateParams, $location, Authentication, Mails, LanguageService) {
    $scope.authentication = Authentication;
    $rootScope.hideFooter = true;
    $scope.hasMoreMail = true;

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

    // The header controller detected we have new mail, refresh new mail list.
    $rootScope.$on('newMailReceived', function() {
      $scope.queryEmailsForView();
    });

    $scope.queryEmailsForView = function() {
      // We have to read at least one email
      if ($scope.numOfMails === 0) {
        $scope.numOfMails = 1;
      }
      // Read 1 more email than we want to display, that will let us know if there
      // are more emails that can be read from the server.
      $scope.mails = Mails.query({ limit: $scope.numOfMails + 1 }, function(err) {
        if ($scope.mails.length === ($scope.numOfMails + 1)) {
          $scope.hasMoreMail = true;
          // discard the last element, only display desired email count
          $scope.mails.splice(-1,1);
        } else {
          $scope.hasMoreMail = false;
        }
        $scope.mails.forEach(function(mail) {
          mail.contentShort = mail.content.substr(0,80);
        });
      });
    };

    // Remove existing Mail
    $scope.removeMail = function (mail) {
      mail.$remove();

      for (var i in $scope.mails) {
        if ($scope.mails[i] === mail) {
          $scope.mails.splice(i, 1);
        }
      }
      $scope.numOfMail--;
    };

    // ReplyTo existing Mail
    $scope.replyMail = function (mail, reportAdmin) {
      $scope.mail = mail;
      $scope.reportAdmin = reportAdmin;

      if (reportAdmin) {
        $http.get('/api/mails/' + mail,{ cache: true }).then(function(response) {
          $scope.mail = response.data;
          $('#modalReply').openModal();
        });
      }
      else {
        $('#modalReply').openModal();
      }
    };

    // Report existing Mail
    $scope.reportMail = function (mail) {
      $scope.mail = mail;
      $scope.title = $scope.properties.reportTitle;
      $scope.content = $scope.properties.reportBody + mail.content;

      $http.get('/api/users/admin',{ cache: true }).then(function(response) {
        $scope.adminId = response.data;
        $('#modalReport').openModal();
      });
    };

    $scope.markAsRead = function(mail) {
      if (mail.unread) {
        mail.unread = false;
        mail.$update(function() {
          mail.contentShort = mail.content.substr(0,80);
        }, function(errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
    };

    $scope.modalDetails = function(mail){
      $scope.mail = mail;
      $scope.markAsRead(mail);
      $('#modalDetails').openModal();
    };

    // Find a list of Mails
    $scope.find = function (numExtraMails) {
      if (numExtraMails === 0) {
        $scope.numOfMails = parseInt($window.innerHeight / 100);
      } else {
        $scope.numOfMails += numExtraMails;
      }
      $scope.queryEmailsForView();
    };

    // Find existing Mail
    $scope.findOne = function () {
      $scope.mail = Mails.get({
        mailId: $stateParams.MailId
      });
    };

  }
]);
