/* indent: 0 */
'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Match = mongoose.model('Match'),
  User = mongoose.model('User'),
  Offering = mongoose.model('Offering'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Helper function to filter out sensitive/internal fields from an array of documents.
 */
function filterInternalMatchFields(rawDocs) {
  var filteredResults = [];
  rawDocs.forEach(function(rawDoc) {
    // Skip invalid matches that do not have associated users/offerings
    if ((rawDoc.owner && rawDoc.owner._id) && (rawDoc.requester && rawDoc.requester._id) && (rawDoc.offering && rawDoc.offering._id)) {
      filteredResults.push(rawDoc.getPublicObject());
    }
  });
  return filteredResults;
}

/**
 * Create a match
 */
exports.create = function (req, res) {
  var match = new Match();
  match.requester = req.user;
  match.requesterId = req.user._id.toString();
  var now = new Date(); 
  match.created = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  match.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  match.ownerState.seen = false;
  match.ownerState.blockContact = false;
  match.ownerState.acceptMatch = false;
  match.ownerState.rejectMatch = false;
  match.ownerState.lastMessage = '';
  match.ownerState.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  // The requester creates the match object, so the initial object must be from the requester.
  match.requesterState.lastMessage = req.body.requesterState.lastMessage;
  match.requesterState.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  match.requesterState.blockContact = false;
  match.requesterState.withdrawRequest = false;
  User.findById(mongoose.Types.ObjectId(req.body.ownerId), function(err, foundOwner) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else if (!foundOwner) {
      return res.status(400).send({
        message: 'No owner with that identifier has been found'
      });
    } else {
      match.owner = foundOwner;
      match.ownerId = foundOwner._id.toString();
      Offering.findById(mongoose.Types.ObjectId(req.body.offeringId), function(err, foundOffering) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else if (!foundOffering) {
          return res.status(400).send({
            message: 'No offering with that identifier has been found'
          });
        } else {
          match.offering = foundOffering;
          match.offeringId = foundOffering._id.toString();
          match.save(function (err) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              var filteredMatch = match.getPublicObject();
              res.json(filteredMatch);
            }
          });
        }
      });
    }
  });
};

/**
 * Show the current match
 */
exports.read = function (req, res) {
  res.json(req.match);
};

/**
 * Update a match
 */
exports.update = function (req, res) {
  Match.findById(mongoose.Types.ObjectId(req.match._id), function(err, match) {
    // TODO: Need to populate the various fields, so we return a proper
    // object to the user in the end?
    var now = new Date(); 
    match.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    // TODO: Language translation support for the *State.message fields?
    if (req.user._id.toString() === match.ownerId) {
      match.ownerState = req.body.ownerState;
      match.ownerState.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    } else {
      match.requesterState = req.body.requesterState;
      match.requesterState.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    }
    match.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        var filteredMatch = match.getPublicObject();
        res.json(filteredMatch);
      }
    });
  });
};

/**
 * Delete an match
 */
exports.delete = function (req, res) {
  Match.remove({ _id: mongoose.Types.ObjectId(req.match._id) }, function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(req.match);
    }
  });
};

/**
 * Search Matches based on input criteria
 */
exports.search = function (req, res) {
  // Build up query, depending on whether the user is authenticated or not.  Authenticated
  // users are returned a list of all their matches.  Non-authenticated users get
  // a sampling of 5 (random) matches - the limit is to reduce load on the server.
  // Note that currently only unit tests call this without authentication.
  var query = Match.find({});
  // TODO: If user is admin, then return all matches? use results pagination?
  if (req.query.offeringId) {
    query.where('offeringId', req.query.offeringId);
  }
  if (req.user) {
    query.or([{ ownerId: req.user._id.toString() }, { requesterId: req.user._id.toString() }]);
    query.sort('-created');
  } else {
    query.limit(5);
  }
  query.populate('owner');
  query.populate('requester');
  query.populate('offering');

  query.exec(function (err, matches) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // restrict results to only public-viewable fields
      var publicResults = filterInternalMatchFields(matches);
      res.json(publicResults);
    }
  });
};

/**
 * Match middleware
 */
exports.matchByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Match is invalid'
    });
  }

  Match.findById(id).populate('owner').populate('requester').populate('offering').exec(function (err, match) {
    if (err) {
      return next(err);
    } else if (!match) {
      return res.status(404).send({
        message: 'No match with that identifier has been found'
      });
    }
    req.match = match.getPublicObject();
    next();
  });
};
