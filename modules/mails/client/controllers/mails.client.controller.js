'use strict';

// Mails controller - handles listing and replies etc.
angular.module('mails').controller('MailsController', ['$scope', '$rootScope', '$window', '$http', '$stateParams', '$location',
     'Authentication', 'Mails', 'LanguageService', 'MailService',
  function ($scope, $rootScope, $window, $http, $stateParams, $location, Authentication, Mails, LanguageService, MailService) {
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
      $scope.numOfMails++;
      $scope.queryEmailsForView();
    });

    //FIXME remove replyTo
    $scope.sendInMail = function(mail) {
      var mailDetail = {
        title: mail.title,
        content: mail.replyData,
        recipientId: mail.sender._id,
        replyTo: mail.recipient._id,
        matchId: mail.matchId
      };
      MailService.sendNewMail(mailDetail, function(errorResponse, successfulMail){
        if (errorResponse){
          console.log('failed to send an email ' + errorResponse);
             
        } else {
          console.log('successfully sent an email ' + successfulMail);
          var $toastContent = $('<span>'+$scope.properties.mailSentSuccessfully+'</span>');
          Materialize.toast($toastContent, 4000);
        }
      });
    };
    
    $scope.queryEmailsForView = function() {
      // We have to read at least one email
      if ($scope.numOfMails === 0) {
        $scope.numOfMails = 1;
      }
      // Read 1 more email than we want to display, that will let us know if there
      // are more emails that can be read from the server. Mails.query comes from mongoose (Mails is the schema of the collection) 
      // and routes to the server side
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

    // ReplyTo existing Mail FIXME do we need this?
    $scope.replyMail = function (mail, reportAdmin) {
      $scope.mail = mail;
      $scope.reportAdmin = reportAdmin;

      if (reportAdmin) {
        $http.get('/api/mails/' + mail,{ cache: true }).then(function(response) {
          $scope.mail = response.data;
        });
      }
    };

    // Report existing Mail  FIXME rewrite
    $scope.reportMail = function (mail) {
      $scope.mail = mail;
      $scope.title = $scope.properties.reportTitle;
      $scope.content = $scope.properties.reportBody + mail.content;

      $http.get('/api/users/admin',{ cache: true }).then(function(response) {
        $scope.adminId = response.data;
      });
    };

    $scope.clickMailTitle = function(mail) {
      // mark as read
      if (mail.unread === true) {
        mail.unread = false;
        mail.$update(function() {
          mail.contentShort = mail.content.substr(0,80);
          // Tell header to refresh new mail count
          $rootScope.$broadcast('refreshHeader');
        }, function(errorResponse) {
          $scope.error = errorResponse.data.message;
        });
      }
      //if it's in replying mode, remove the replying text area 
      if (mail.inReplyingMode === true){
        mail.inReplyingMode = false;
      }
    };
    
    // In replying mode, the text reply doesn't show
    $scope.setReplyingMode = function(mail) {
      mail.inReplyingMode = true;
    };

    // Find a list of Mails
    $scope.find = function (numExtraMails) {
      if (numExtraMails === 0) {
        $scope.numOfMails = parseInt($window.innerHeight / 100);
      } else if ($scope.hasMoreMail) {
        $scope.numOfMails += numExtraMails;
      }
      $scope.queryEmailsForView();
    };

  }
]);
