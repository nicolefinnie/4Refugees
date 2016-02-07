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

function saveAndReturn(match, res) {
  match.save(function (err) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      var filteredMatch = match.getPublicObject();
      res.json(filteredMatch);
    }
  });
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
  match.ownerState.lastMsg = [{ language: 'en', text: '' }];
  match.ownerState.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  // The requester creates the match object, so the initial object must be from the requester.
  // TODO: Update this once the match client sends in new schema format!
  match.requesterState.lastMsg = req.body.requesterState.lastMsg;
  match.requesterState.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  match.requesterState.blockContact = false;
  match.requesterState.withdrawRequest = false;
  User.findById(mongoose.Types.ObjectId(req.body.ownerId), function(err, foundOwner) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else if (!foundOwner) {
      return res.status(400).send({ message: 'No owner with that identifier has been found' });
    } else {
      match.owner = foundOwner;
      match.ownerId = foundOwner._id.toString();
      Offering.findById(mongoose.Types.ObjectId(req.body.offeringId), function(err, foundOffering) {
        if (err) {
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        } else if (!foundOffering) {
          return res.status(400).send({ message: 'No offering with that identifier has been found' });
        } else {
          match.offering = foundOffering;
          match.offeringId = foundOffering._id.toString();
          saveAndReturn(match, res);
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
  Match.findById(mongoose.Types.ObjectId(req.match._id)).populate('owner').populate('requester').populate('offering').exec(function(err, match) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else if (!match) {
      return res.status(400).send({ message: 'No match with that identifier has been found' });
    } else {
      var now = new Date(); 
      var acceptMatch = false;
      match.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      // TODO: Language translation support for the *State.message fields?
      if (req.user._id.toString() === match.ownerId) {
        acceptMatch = (true === req.body.ownerState.acceptMatch) && (false === match.ownerState.acceptMatch);
        match.ownerState = req.body.ownerState;
        match.ownerState.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      } else {
        match.requesterState = req.body.requesterState;
        match.requesterState.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      }
      if (acceptMatch) {
        // We need to update the offering first to mark it as accepted, then save the match.
        match.offering.acceptMatchAndSave(function(err, updateResults) {
          if (err) {
            return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
          } else {
            saveAndReturn(match, res);
          }
        });
      } else {
        saveAndReturn(match, res);
      }
    }
  });
};

/**
 * Delete an match
 */
exports.delete = function (req, res) {
  Match.remove({ _id: mongoose.Types.ObjectId(req.match._id) }, function(err) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      res.json(req.match);
    }
  });
};

function rebuildMatchIndexes() {
  Match.ensureIndexes(function(err) {
    if (err) { 
      console.log('Match: error rebuilding indexes: ' + err); 
    } else {
      console.log('Match: indexes re-built succesfully.');
    } 
  });
}

/**
 * Handle migrating all docs from an old MatchSchema to the current MatchSchema.
 */
function adminMatchMigrateSchema(matches) {
  var numMigrated = 0;
  matches.forEach(function(match) {
    if ((match.ownerState.lastMsg.length === 0) || (match.requesterState.lastMsg.length === 0)) {
      numMigrated = numMigrated + 1;
      var newOwnerMsg = {
        language: 'en',
        text: match.ownerState.lastMessage
      };
      var newRequesterMsg = {
        language: 'en',
        text: match.requesterState.lastMessage
      };
      if (match.ownerState.lastMsg.length === 0) {
        match.ownerState.lastMsg = [];
        match.ownerState.lastMsg.push(newOwnerMsg);
        match.ownerState.lastMessage = undefined;
      }
      if (match.requesterState.lastMsg.length === 0) {
        match.requesterState.lastMsg = [];
        match.requesterState.lastMsg.push(newRequesterMsg);
        match.requesterState.lastMessage = undefined;
      }
      match.save(function (err) {
        if (err) {
          console.log('Match: Admin: Error saving migrated match with id \'' + match._id.toString() + '\', error: ' + JSON.stringify(err));
        }
      });
    }
  });
  console.log('Match: Admin: Migrated ' + numMigrated + ' out of ' + matches.length + ' matches to new schema.');
}

/**
 * Handle deleting all docs from the MatchSchema.
 */
function adminMatchDeleteAll(req, res) {
  Match.remove({}, function(err, removed) {
    if (err) {
      console.log('Match: Admin: error deleting all matches: ' + err);
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      console.log('Match: Admin: All matches removed: ' + removed);
      rebuildMatchIndexes();
      var results = [];
      res.json(results);
    }
  });
}

/**
 * Administrative functionality commands, req.query.adminRequest:
 * 'list' -> list all matches
 * 'migrate_schema' -> convert matches from old schema to new schema
 * 'delete_all' -> remove all matches
 */
function handleAdminRequests(req, res) {
  console.log('Match: Admin: \'' + req.query.adminRequest + '\' request issued');

  if ((req.query.adminRequest === 'list') ||
      (req.query.adminRequest === 'migrate_schema')) {
    var listQuery = Match.find({});
    listQuery.sort('-created');
    listQuery.populate('owner');
    listQuery.populate('requester');
    listQuery.populate('offering');
    listQuery.exec(function (err, matches) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
        if (req.query.adminRequest === 'migrate_schema') {
          adminMatchMigrateSchema(matches);
        }
        // else, list request, just return current results

        // We don't want to use filterInternalMatchFields(), since that restricts the
        // results to only those matches with valid owners/requesters/offerings.  The
        // admin will want to see ALL matches.
        var publicResults = [];
        matches.forEach(function(match) {
          publicResults.push(match.getPublicObject());
        });
        res.json(publicResults);
      }
    });
  } else if (req.query.adminRequest === 'delete_all') {
    adminMatchDeleteAll(req, res);
  } else {
    console.log('Match: Admin: \'' + req.query.adminRequest + '\' request not supported.');
  }
}

/**
 * Search Matches based on input criteria
 */
exports.search = function (req, res) {
  if (req.query.adminRequest) {
    if (!req.user || !req.user.roles || (req.user.roles.indexOf('admin') < 0)) {
      return res.status(403).json({ message: 'User is not authorized' });
    } else {
      handleAdminRequests(req, res);
    }
  } else {
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
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
        // restrict results to only public-viewable fields
        var publicResults = filterInternalMatchFields(matches);
        res.json(publicResults);
      }
    });
  }
};

/**
 * Match middleware
 */
exports.matchByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Match is invalid' });
  }

  Match.findById(id).populate('owner').populate('requester').populate('offering').exec(function (err, match) {
    if (err) {
      return next(err);
    } else if (!match) {
      return res.status(404).send({ message: 'No match with that identifier has been found' });
    }
    req.match = match.getPublicObject();
    next();
  });
};
