'use strict';

// Mails controller - handles listing and replies etc.
angular.module('mails').controller('MailsController', ['$scope', '$rootScope', '$window', '$http', '$stateParams', '$location',
     'Authentication', 'Mails', 'Socket', 'LanguageService',
  function ($scope, $rootScope, $window, $http, $stateParams, $location, Authentication, Mails, Socket, LanguageService) {
    $scope.authentication = Authentication;
    $rootScope.hideFooter = true;

    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    $scope.languageInitialized = false;

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      $scope.reloadLanguage();
    });

    // Make sure the Socket is connected to notify of updates
    if (!Socket.socket) {
      Socket.connect();
    }

    // Remove existing Mail
    $scope.removeMail = function (mail) {
      if (mail) {
        mail.$remove();

        for (var i in $scope.mails) {
          if ($scope.mails[i] === mail) {
            $scope.mails.splice(i, 1);
          }
        }
        $scope.numOfMail--;
        if ($scope.mailCount && $scope.mailCount[0])
          $scope.mailCount[0].numResults--;
      } else {
        $scope.mail.$remove(function () {
          $location.path('mails');
        });
      }
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
      LanguageService.getPropertiesByViewName('mail', $http, function(translationList) {
        $scope.title = translationList.reportTitle;
        $scope.content = translationList.reportBody + mail.content;

        $http.get('/api/users/admin',{ cache: true }).then(function(response) {
          $scope.adminId = response.data;
          $('#modalReport').openModal();
        });
      });
    };


    $scope.modalDetails = function(mail){
      $scope.mail = mail;
      $('#modalDetails').openModal();
    };

    // Update existing Mail 
    $scope.update = function (isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'mailForm');

        return false;
      }

      var mail = $scope.mail;

      mail.$update(function () {
        $location.path('mails/' + mail._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Mails
    $scope.find = function (num) {
      $scope.initLanguage();
      $scope.mailCount = Mails.query({ countOnly: 'true' }, function(err) {
        
        if (num === 0 || $scope.mailCount[0] && $scope.mailCount[0].numResults > $scope.numOfMails)
        {
          if (num === 0)
            $scope.numOfMails = parseInt($window.innerHeight / 100);
          else 
            $scope.numOfMails += num;

          $scope.mails = Mails.query({ reset : true, limit: $scope.numOfMails }, function(err) {
            for(var i = 0,len = $scope.mails.length; i < len;i++) {
              $scope.mails[i].contentShort = $scope.mails[i].content.substr(0,80);
            }
          });
        }
      });

      // Emit a 'mailMessage' message event with an empty JSON mail object to erase the new banner
      var message = {
        content : {
          recipient : Authentication.user._id
        }
      };
      Socket.emit('mailMessage', message);
    };

        // Add an event listener to the 'mailMessage' event and show new inMails for logged in users
    Socket.on('mailMessage', function (message) {

      if (message.content.recipient === Authentication.user._id) {
        if (message.content.title) {
          $scope.mails = Mails.query({ reset : false, limit: $scope.numOfMails }, function() {
            for(var i = 0,len = $scope.mails.length; i < len;i++) {
              $scope.mails[i].contentShort = $scope.mails[i].content.substr(0,80);
            }
          });
        }
      }
    });


    // Find a list of new Mails
    $scope.findNew = function () {
      $scope.initLanguage();
      $scope.mails = Mails.query({ unread : true,reset : true }, function() {
        for(var i = 0,len = $scope.mails.length; i < len;i++) {
          $scope.mails[i].contentShort = $scope.mails[i].content.substr(0,80);
        }
      });

      // Emit a 'mailMessage' message event with an empty JSON mail object
      var message = {
        content : {
          recipient : Authentication.user._id
        }
      };
      Socket.emit('mailMessage', message);
    };

    // Find existing Mail
    $scope.findOne = function () {
      $scope.initLanguage();
      $scope.mail = Mails.get({
        mailId: $stateParams.MailId
      });
    };

    $scope.tags = [];

    $scope.loadUsers = function($query) {
      var found = false;
      return $http.get('/api/users',{ cache: true }).then(function(response) {
        var users = response.data;
        return users.filter(function(users) {
          var match = users.username && users.username.toLowerCase().indexOf($query.toLowerCase()) !== -1;
          if (found) match = false;
          else if (match) found = true;
          return match;
        });
      });
    };

    $scope.initLanguage = function () {
      if (!$scope.languageInitialized) {
        $scope.languageInitialized = true;
        $scope.reloadLanguage();
      }
    };

    $scope.reloadLanguage = function () {
      LanguageService.getPropertiesByViewName('mail', $http, function(translationList) {
        $scope.properties = translationList;
      });
    };

  }
]);
