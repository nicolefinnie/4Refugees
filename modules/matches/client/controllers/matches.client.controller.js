'use strict';

//Matches controller only available for authenticated users
angular.module('matches').controller('MatchesController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                           'Authentication', 'Matches', 'LanguageService', 'MailService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Matches, LanguageService, MailService) {
    $scope.authentication = Authentication;
    $rootScope.hideFooter = false;
    //Note that the controller must call $scope.translateStatusCodes(properties) when first
    //initialized, and whenever the current language is modified.
    $scope.StatusCodes = {
      NONE:             { value: 0, message: '' }, 
      ERROR_NO_MESSAGE: { value: 1, message: '' }
    };

    // language change clicked
    $rootScope.$on('tellAllControllersToChangeLanguage', function(){
      LanguageService.getPropertiesByViewName('matches', $http, function(translationList) {
        $scope.properties = translationList;
        $scope.translateStatusCodes();
        // Update results according to new language
        if ($scope.matches) {
          $scope.matches.forEach(function(match) {
            $scope.prepareMatchForView(match);
          });
        }
      });
    });

    $scope.translateStatusCodes = function() {
      $scope.StatusCodes.ERROR_NO_MESSAGE.message = $scope.properties.errorNoMessage;
    };

    $scope.toggleMoreHelp = function(match) {
      match.showMoreHelp = !match.showMoreHelp;
    };

    $scope.toggleReplyMode = function(match) {
      match.replyMode = !match.replyMode;
    };

    $scope.amIOwner = function(match) {
      return ($scope.authentication.user._id.toString() === match.ownerId);
    };

    $scope.profileModalDetails = function(currentProfile){
      $scope.activeProfile = currentProfile; 
      $('#userProfile').openModal();
    };

    // Validate a proper match message was provided
    $scope.validateMatchMessage = function(match) {
      var isValid = (match.newMessage !== undefined && match.newMessage.length > 0);
      if (!isValid) {
        match.error = $scope.StatusCodes.ERROR_NO_MESSAGE;
        throw new Error('Match: Invalid message');
      }
    };
    
    $scope.createOrUpdate = function(match) {
      match.error = $scope.StatusCodes.NONE;

      $scope.validateMatchMessage(match);
      var newMessage = {
        language: LanguageService.getCurrentLanguage(),
        text: match.newMessage
      };

      if ($scope.amIOwner(match)) {
        match.ownerState.lastMsg = [newMessage];
      } else {
        match.requesterState.lastMsg = [newMessage];
      }

      if (match.isNew) {
        $scope.create(match);
      } else {
        $scope.update(match);
      }
    };

    // Send a mail concerning this match to the other person
    $scope.sendMessage = function(match, newMessage, matchIsNew) {
      var recipientId = $scope.amIOwner(match) ? match.requesterId : match.ownerId;
      var subject = '';
      // TODO: Translation/language support, need to know the recipient's
      // preferred language to generate an appropriate subject.  And, we
      // should extend the offering to always send all translated descriptions
      // back, i.e. description.en, description.de, description.ar.
      var offeringDescription = LanguageService.getTextForCurrentLanguage(match.offering.title);
      if (matchIsNew) {
        subject = 'Offering contact request: ' + offeringDescription;
      } else {
        subject = 'Follow-up on offering: ' + offeringDescription;
      }
      // TODO: How to handle message translation? If we do the message translation
      // when we store the match, we can use the pre-translated message here...
      // Alternatively, we could just let the mail language translation handle this,
      // but if the match needs to translate anyways, we can save one translation....
      // Yet another option is to get the result from the sendNewMail() request below,
      // and if that contains a translated message, issue a match update...
      match.newMessage = newMessage;
      $scope.validateMatchMessage(match);

      var messageDetails = {
        'title': subject,
        'content': match.newMessage,
        'recipientId': recipientId,
        'matchId': match._id.toString()
      };
      MailService.sendNewMail(messageDetails, function(errorResponse, sentMail) {
        if (errorResponse) {
          // TODO: Better error message handling? Translation support? 'Error sending mail: ' + errorResponse.data.message?
          match.error = errorResponse.data.message;
        } else {
          $scope.prepareMatchForView(match);
        }
      });
    };

    // Create new Match server request
    $scope.create = function (match) {
      var messageToSend = match.newMessage;
      match.$save(function (response) {
        // Send a message to the offering owner now that the match object is created.
        $scope.sendMessage(match, messageToSend, true);
      }, function (errorResponse) {
        match.error = errorResponse.data.message;
      });
    };

    // Update existing Match server request
    $scope.update = function (match) {
      var messageToSend = match.newMessage;
      match.$update(function () {
        $scope.sendMessage(match, messageToSend, false);
      }, function (errorResponse) {
        match.error = errorResponse.data.message;
      });
    };

    $scope.contact = function (match) {
      // Nothing special, just update my last message and send mail
      $scope.createOrUpdate(match);
    };

    // Current user does not want this match
    $scope.rejectMatch = function (match) {
      if ($scope.amIOwner(match)) {
        match.ownerState.rejectMatch = true;
      } else {
        match.requesterState.withdrawRequest = true;
      }
      $scope.createOrUpdate(match);
    };

    // Owner has agreed on this match and will provide the requester with this offering
    $scope.acceptMatch = function (match) {
      // TODO: Assert that we are owner? Button should only be visible to owner....
      // assert($scope.amIOwner($scope.match));
      match.ownerState.acceptMatch = true;
      $scope.createOrUpdate(match);
    };

    // Remove single Match
    $scope.removeSingleMatch = function (match) {
      match.$remove(function () {
        // Re-direct to their list of remaining matches
        $location.path('matches');
      });
    };

    // Remove one match from within list of all my matches
    $scope.deleteMatch = function (match) {   
      match.$remove();
      for (var i in $scope.matches) {
        if ($scope.matches[i] === match) {
          $scope.matches.splice(i, 1);
        }
      }
    };

    // Converts server match JSON into client match, for integration with views.
    $scope.prepareMatchForView = function (match) {
      if (match.ownerState.lastMsg && (match.ownerState.lastMsg[0].text.length > 0)) {
        match.ownerStateLastMessage = LanguageService.getTextForCurrentLanguage(match.ownerState.lastMsg);
      }
      if (match.requesterState.lastMsg && (match.requesterState.lastMsg[0].text.length > 0)) {
        match.requesterStateLastMessage = LanguageService.getTextForCurrentLanguage(match.requesterState.lastMsg);
      }
      if ($scope.amIOwner(match)) {
        match.theOther = match.requester;
      } else {
        match.theOther = match.owner;
      }
      if (match.offering && match.offering.title) {
        match.offering.description = LanguageService.getTextForCurrentLanguage(match.offering.title);
      }
      // Setup the last message from owner and requester, in order, to help with the view
      var lastOwnerMessage = {
        date: match.ownerState.updated,
        user: match.owner,
        viewName: $scope.amIOwner(match) ? $scope.properties.me : match.owner.displayName,
        message: match.ownerStateLastMessage
      };
      var lastRequesterMessage = {
        date: match.requesterState.updated,
        user: match.requester,
        viewName: $scope.amIOwner(match) ? match.requester.displayName : $scope.properties.me,
        message: match.requesterStateLastMessage
      };
      match.lastMessages = [];
      if (lastOwnerMessage.date <= lastRequesterMessage.date) {
        match.lastMessages.push(lastOwnerMessage);
        match.lastMessages.push(lastRequesterMessage);
      } else {
        match.lastMessages.push(lastRequesterMessage);
        match.lastMessages.push(lastOwnerMessage);
      }
      match.newMessage = '';
      // Determine which buttons should be shown for this match.
      $scope.setButtonVisibility(match);
      match.showMoreHelp = false;
      match.replyMode = false;
    };

    // Initialize list of all my matches
    $scope.initializeMatches = function () {
      LanguageService.getPropertiesByViewName('matches', $http, function(translationList) {
        $scope.properties = translationList;
        $scope.translateStatusCodes();
        $scope.matches = Matches.query({ }, function () {
          $scope.matches.forEach(function(match) {
            $scope.prepareMatchForView(match);
          });
          var i, foundMatch;
          if ($scope.matchId && ($scope.matchId !== '0')) {
            // Look for the given match, if found, put it at the top of the list.
            for(i = 0; i < $scope.matches.length; i++) {
              if ($scope.matchId === $scope.matches[i]._id) {
                if (i !== 0) {
                  foundMatch = $scope.matches.splice(i, 1);
                  $scope.matches.splice(0, 0, foundMatch[0]);
                }
                break;
              }
            }
          } else if ($scope.offeringId && ($scope.offeringId !== '0')) {
            // See if we can find an existing match for this offering, and if so,
            // put that match at the top of the list.
            for(i = 0; i < $scope.matches.length; i++) {
              if ($scope.offeringId === $scope.matches[i].offeringId) {
                foundMatch = $scope.matches[i];
                if (i !== 0) {
                  $scope.matches.splice(i, 1);
                  $scope.matches.splice(0, 0, foundMatch);
                }
                break;
              }
            }

            // No match for this offering is found, create a new one, and
            // insert at beginning of the list.
            if (!foundMatch) {
              var newMatch = new Matches({ });
              $scope.initializeNewMatch(newMatch);
              $scope.matches.splice(0, 0, newMatch);
            }
          }
        });
      });
    };

    // Figure out which buttons should be shown for a particular match.  For example, if
    // the owner has accepted the match, we do not need to show the accept button any more.
    $scope.setButtonVisibility = function(match) {
      if ($scope.amIOwner(match)) {
        match.showBlockButton = !match.ownerState.blockContact;
        // TODO: How to show owner (and requester) that the match is accepted or rejected?
        match.showAcceptButton = !match.ownerState.acceptMatch;
        match.showRejectButton = !match.ownerState.rejectMatch;
        match.showContactButton = !match.requesterState.blockContact;
      } else {
        // If match has not yet been created, the only option for match requester is to contact owner
        match.showBlockButton = (!match.isNew && !match.requesterState.blockContact);
        match.showAcceptButton = false;
        match.showRejectButton = false;
        match.showContactButton = !match.ownerState.blockContact;
      }
    };

    $scope.initializeNewMatch = function(match) {
      // Start off with an empty match, first time this requester is interested
      // in the given offering
      var now = new Date();
      match.isNew = true;
      match.created = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      match.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      match.ownerState = { 'lastMsg': [{ 'language': 'en', 'text': '' }], 'updated': new Date(), 'seen': false, 'blockContact': false, 'acceptMatch': false, 'rejectMatch': false };
      match.ownerStateLastMessage = '';
      match.requesterState = { 'lastMsg': [{ 'language': 'en', 'text': '' }], 'updated': new Date(), 'blockContact': false, 'withdrawRequest': false };
      match.requesterStateLastMessage = '';
      match.owner = { 'displayName': $scope.recipientName };
      match.ownerId = $scope.recipientId;
      match.requester = { 'displayName': $scope.authentication.user.displayName };
      match.requesterId = $scope.authentication.user._id.toString();
      match.offering = { 'description': $scope.offeringDescription };
      match.offeringId = $scope.offeringId;
      $scope.prepareMatchForView(match);
      // If creating a new match, we default to edit/reply mode.
      match.replyMode = true;
    };

  }
]);
