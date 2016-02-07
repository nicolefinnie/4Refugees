'use strict';

//Matches controller only available for authenticated users
angular.module('matches').controller('MatchesController', ['$scope', '$rootScope', '$http', '$stateParams', '$location', 
                                                           'Authentication', 'Matches', 'LanguageService', 'MailService',
  function ($scope, $rootScope, $http, $stateParams, $location, Authentication, Matches, LanguageService, MailService) {
    $scope.authentication = Authentication;
   
    $scope.match = {};
    // TODO: Do we need an 'unblock' button if the user changes their mind?
    $scope.showBlockButton = false;
    $scope.showAcceptButton = false;
    $scope.showRejectButton = false;
    $scope.showContactButton = false;
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
        if ($scope.match && $scope.match.ownerStateLastMessage) {
          $scope.prepareMatchForView($scope.match);
        }
      });
    });

    $scope.translateStatusCodes = function() {
      $scope.StatusCodes.ERROR_NO_MESSAGE.message = $scope.properties.errorNoMessage;
    };

    $scope.amIOwner = function(match) {
      return ($scope.authentication.user._id.toString() === match.ownerId);
    };

    $scope.profileModalDetails = function(index, currentProfile){
      $scope.activeProfile = currentProfile; 
      $('#theOtherProfile-'+index).openModal();
    };
    
    $scope.singleProfileModalDetails = function(currentProfile){
      $scope.activeProfile = currentProfile; 
      $('#singleProfile').openModal();
    };

    // Validate a proper match message was provided
    $scope.validateMatchMessage = function(matchMessage) {
      var isValid = (matchMessage !== undefined && matchMessage.length > 0);
      if (!isValid) {
        $scope.error = $scope.StatusCodes.ERROR_NO_MESSAGE;
        throw new Error('Match: Invalid message');
      }
    };
    
    $scope.createOrUpdate = function() {
      $scope.error = $scope.StatusCodes.NONE;

      $scope.validateMatchMessage($scope.matchMessage);
      var newMessage = {
        language: LanguageService.getCurrentLanguage(),
        text: $scope.matchMessage
      };

      if ($scope.amIOwner($scope.match)) {
        $scope.match.ownerState.lastMsg = [newMessage];
      } else {
        $scope.match.requesterState.lastMsg = [newMessage];
      }

      if ($scope.matchId === '0') {
        $scope.create();
      } else {
        $scope.update();
      }
    };

    // Send a mail concerning this match to the other person
    $scope.sendMessage = function() {
      var match = $scope.match;
      var offering = match.offering;
      var recipientId = $scope.amIOwner(match) ? match.requesterId : match.ownerId;
      var subject = '';
      // TODO: Translation/language support, need to know the recipient's
      // preferred language to generate an appropriate subject.  And, we
      // should extend the offering to always send all translated descriptions
      // back, i.e. description.en, description.de, description.ar.
      if ($scope.matchId === '0') {
        subject = 'Offering contact request: ' + offering.description;
      } else {
        subject = 'Follow-up on offering: ' + offering.description;
      }
      // TODO: How to handle message translation? If we do the message translation
      // when we store the match, we can use the pre-translated message here...
      // Alternatively, we could just let the mail language translation handle this,
      // but if the match needs to translate anyways, we can save one translation....
      // Yet another option is to get the result from the sendNewMail() request below,
      // and if that contains a translated message, issue a match update...
      $scope.validateMatchMessage($scope.matchMessage);

      var messageDetails = {
        'title': subject,
        'content': $scope.matchMessage,
        'recipientId': recipientId,
        'matchId': match._id.toString()
      };
      MailService.sendNewMail(messageDetails, function(errorResponse, sentMail) {
        if (errorResponse) {
          // TODO: Better error message handling? Translation support? 'Error sending mail: ' + errorResponse.data.message?
          $scope.error = errorResponse.data.message;
        } else {
          // On success, re-direct to the list of all the current user's matches.
          $location.path('matches');
        }
      });
    };

    // Create new Match server request
    $scope.create = function () {
      // Redirect after save
      $scope.match.$save(function (response) {
        // Send a message to the offering owner now that the match object is created.
        $scope.sendMessage();
        $scope.clearForm();
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Update existing Match server request
    $scope.update = function () {
      $scope.match.$update(function () {
        $scope.sendMessage();
        $scope.clearForm();
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Current user wants to prevent contact from other person about this match
    $scope.blockContact = function () {
      if ($scope.amIOwner($scope.match)) {
        $scope.match.ownerState.blockContact = true;
      } else {
        $scope.match.requesterState.blockContact = true;
      }
      $scope.createOrUpdate();
    };

    // Current user does not want this match
    $scope.rejectMatch = function () {
      if ($scope.amIOwner($scope.match)) {
        $scope.match.ownerState.rejectMatch = true;
      } else {
        $scope.match.requesterState.withdrawRequest = true;
      }
      $scope.createOrUpdate();
    };

    // Owner has agreed on this match and will provide the requester with this offering
    $scope.acceptMatch = function () {
      // TODO: Assert that we are owner? Button should only be visible to owner....
      // assert($scope.amIOwner($scope.match));
      $scope.match.ownerState.acceptMatch = true;
      $scope.createOrUpdate();
    };

    // Remove single Match
    $scope.removeSingleMatch = function (match) {
      match.$remove(function () {
        // Re-direct to their list of remaining matches
        $location.path('matches');
      });
    };

    // Remove one match from within list of all my matches
    $scope.removeMatchFromList = function (match) {
      match.$remove();
      for (var i in $scope.matches) {
        if ($scope.matches[i] === match) {
          $scope.matches.splice(i, 1);
        }
      }
    };

    // Converts server match JSON into client match, for integration with views.
    $scope.prepareMatchForView = function (match) {
      if (!match.ownerState.lastMsg || (match.ownerState.lastMsg[0].text.length === 0)) {
        match.ownerStateLastMessage = $scope.properties.noMessageYet;
      } else {
        match.ownerStateLastMessage = LanguageService.getTextForCurrentLanguage(match.ownerState.lastMsg);
      }
      if (!match.requesterState.lastMsg || (match.requesterState.lastMsg[0].text.length === 0)) {
        match.requesterStateLastMessage = $scope.properties.noMessageYet;
      } else {
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
    };

    // Find all my matches - init function for matches.listMine
    $scope.findAllMine = function () {
      delete $scope.match;
      LanguageService.getPropertiesByViewName('matches', $http, function(translationList) {
        $scope.properties = translationList;
        $scope.translateStatusCodes();
        $scope.matches = Matches.query({
        }, function () {
          $scope.matches.forEach(function(match) {
            $scope.prepareMatchForView(match);
          });
        });
      });
    };

    // Clear form fields, i.e. after a successful create or update
    $scope.clearForm = function () {
      delete $scope.message;
    };

    $scope.setButtonVisibility = function() {
      if ($scope.amIOwner($scope.match)) {
        $scope.showBlockButton = !$scope.match.ownerState.blockContact;
        // TODO: How to show owner (and requester) that the match is accepted or rejected?
        $scope.showAcceptButton = !$scope.match.ownerState.acceptMatch;
        $scope.showRejectButton = !$scope.match.ownerState.rejectMatch;
        $scope.showContactButton = !$scope.match.requesterState.blockContact;
      } else {
        // If match has not yet been created, the only option for match requester is to contact owner
        $scope.showBlockButton = ($scope.matchId !== '0' && !$scope.match.requesterState.blockContact);
        $scope.showAcceptButton = false;
        $scope.showRejectButton = ($scope.matchId !== '0' && !$scope.match.requesterState.withdrawRequest);
        $scope.showContactButton = !$scope.match.ownerState.blockContact;
      }
    };

    // Find existing Match - init function for create+edit paths
    $scope.findOne = function () {
      LanguageService.getPropertiesByViewName('matches', $http, function(translationList) {
        $scope.properties = translationList;
        $scope.translateStatusCodes();
        // TODO: Display some warning message if contact is blocked?
        // TODO: Display notification (and button to unblock) if we blocked contact?
        if (($scope.matchId === undefined) && ($scope.offeringId === undefined)) {
          // With no valid match or offering IDs provided, take them to a list of
          // all their current matches.
          $location.path('matches');
        } else if ($scope.matchId && $scope.matchId !== '0') {
          // Pre-populate form based on an existing match, used when editing an offer
          $scope.match = Matches.get({
            matchId: $stateParams.matchId
          }, function (err) {
            // TODO: Error handling? what if match is not found???
            $scope.matchId = $scope.match._id.toString();
            $scope.prepareMatchForView($scope.match);
            // TODO: Here, we should set the 'ownerState.seen' flag if the owner
            // just loaded this match, and ownerState.seen === false.
            $scope.setButtonVisibility();
          });
        } else {
          // Note - query returns an array of matches, although there will only ever
          // be 1 or 0 matches, we don't allow the same requester to create multiple
          // matches for the same offering. The match owner may have more than one
          // match per offering (multiple requesters interested in the offering), but
          // the owner is not able to get in this code path - they can only access
          // individual matches when contacted by the requester.
          $scope.matches = Matches.query({ offeringId: $scope.offeringId }, function () {
            if ($scope.matches.length > 0) {
              // TODO: Assert that matches.length === 1?
              $scope.matches.forEach(function(match) {
                $scope.match = match;
                $scope.matchId = match._id.toString();
                $scope.prepareMatchForView(match);
                $scope.setButtonVisibility();
                if($scope.amIOwner(match)===true){
                  $scope.match.theOther = match.requester;
                } else {
                  $scope.match.theOther = match.owner;
                }
              });
            } else {
              // Start off with an empty match, first time this requester is interested
              // in the given offering
              $scope.match = new Matches({ });
              var match = $scope.match;
              var now = new Date();
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
              $scope.matchId = '0';
              $scope.prepareMatchForView($scope.match);
              $scope.setButtonVisibility();
            }
          });
        }
      });
    };

  }
]);
