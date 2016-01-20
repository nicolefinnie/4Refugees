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
 * Helper function to filter out sensitive/internal fields before returning to client.
 *
 * @param rawDoc - unfiltered and possibly populated document straight from Mongo
 * @param curUser - current user object
 * @returns a new Match json doc that has sensitive information filtered out.
 */
function filterSingleInternalMatchFields(rawDoc, curUser) {
  var tmpRes = {};
  // TODO: Anything we need to restrict here???
  // Like user emails?
  // TODO: Find out how to call the offering's 'filter-internal-fields' function...
  tmpRes = rawDoc;
  return tmpRes;
}

/**
 * Helper function to filter out sensitive/internal fields from an array of documents.
 *
 * @param rawDocs - unfiltered and possibly populated documents straight from Mongo
 * @param curUser - current user object
 * @returns an array of Match json docs that have sensitive information filtered out.
 */
function filterInternalMatchFields(rawDocs, curUser) {
  var filteredResults = [];
  rawDocs.forEach(function(rawDoc) {
    // Skip invalid matches that do not have any associated user
    if ((rawDoc.owner && rawDoc.owner._id) || (rawDoc.requester && rawDoc.requester._id)) {
      filteredResults.push(filterSingleInternalMatchFields(rawDoc, curUser));
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
              var filteredMatch = filterSingleInternalMatchFields(match, req.user);
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
        var filteredMatch = filterSingleInternalMatchFields(match, req.user);
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
      //console.log('MATCH RAW RESULTS : ' + JSON.stringify(matches));
      // restrict results to only public-viewable fields
      var publicResults = filterInternalMatchFields(matches, req.user);
      // Note - these results do not go through translation services, they are
      // returned the same way the user entered them.
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

  Match.findById(id).populate('owner', 'displayName').populate('requester', 'displayName').populate('offering').exec(function (err, match) {
    if (err) {
      return next(err);
    } else if (!match) {
      return res.status(404).send({
        message: 'No match with that identifier has been found'
      });
    }
    req.match = filterSingleInternalMatchFields(match, req.user);
    next();
  });
};
