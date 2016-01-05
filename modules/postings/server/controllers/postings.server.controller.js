'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  url = require('url'),
  mongoose = require('mongoose'),
  Posting = mongoose.model('Posting'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a posting
 */
exports.create = function (req, res) {
  var posting = new Posting();
  posting.sender = req.user;
  console.log('sender is: ' + JSON.stringify(req.user));
  posting.updated = new Date();
  posting.title = req.body.title;
  posting.content = req.body.content;
  posting.recipient = req.body.recipient;
  console.log('recipient is: ' + JSON.stringify(req.body.recipient));
  posting.offeringId = req.body.offeringId;
  posting.replyTo = req.body.postingId;
  // The recipient is the owner of the email, only they can delete it.
  // This ownerId is also used when deleting a user, to delete all their postings.
  posting.ownerId = posting.recipient.toString();

  posting.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(posting);
    }
  });
};

/**
 * Show the current posting
 */
exports.read = function (req, res) {
  res.json(req.posting);
};

/**
 * Update a posting - not used yet, only to keep grunt test happy
 */
exports.update = function (req, res) {
  var posting = req.posting;

  if (req.body.title) {
    posting.title = req.body.title;
  }
  if (req.body.content) {
    posting.content = req.body.content;
  }

  posting.replyTo = req.body.postingId;
  //posting.recipient = req.body.recipient;

  posting.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(posting);
    }
  });
};

/**
 * Delete a posting - might create dangling replyTo
 */
exports.delete = function (req, res) {
  var posting = req.posting;

  posting.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(posting);
    }
  });
};

/**
 * List of all Postings - admin
 */
exports.listall = function (req, res) {
  var query = (req.user.roles.indexOf('admin') > -1) ? {} : { 'ownerId' : req.user._id.toString() };

  Posting.find(query).sort('-created').populate('sender').populate('recipient').populate('offeringId').exec(function (err, postings) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(postings);
    }
  });
};


/**
 * List of Postings
 */
exports.list = function (req, res) {

  var query = url.parse(req.url, true).query;
  
  if (!req.user) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage('no user')
    });
  }

  //if (!query.recipient && req.user.roles.indexOf('admin') === -1) {
  query.ownerId = req.user._id.toString();
  query.recipient = req.user._id;
  //}

  if (query.unread === 'true') {
    query.unread = true;
  }
  if (query.unread === 'false') {
    query.unread = false;
  }
  
  var reset = false;
  if (query.reset) {
    reset = query.reset;
    delete query.reset;
  }

  if (query.countOnly === 'true') {
    // Client just wanted a count, to avoid cost of populating and sending all docs
    delete query.countOnly;
    Posting.count(query, function (err, count) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        var result = [{ numResults: count }];
        res.json(result);
      }
    });
  } else {
    //Posting.find(query).sort('-created').populate('sender', 'displayName').populate('recipient', 'diplayName').exec(function (err, postings) {
    Posting.find(query).sort('-created').populate('sender').populate('recipient').populate('offeringId').exec(function (err, postings) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        // mark mails read - even for admins only for their specific id
        //if (!query.recipient) {
        //  query.recipient = req.user._id;
        //}
        res.json(postings);
        //console.log('mail result: ' + JSON.stringify(postings));
  
        if (reset) {
          Posting.update(query,{ 'unread': false },{ multi: true }).exec(function(err, res) {
            console.log('mark mail read result: ' + JSON.stringify(res));
          });
        }
      }
    });
  }
      
};

/**
 * Posting middleware
 */
exports.postingByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Posting is invalid'
    });
  }

  Posting.findById(id).populate('sender', 'displayName').populate('recipient', 'diplayName').exec(function (err, posting) {
    if (err) {
      return next(err);
    } else if (!posting) {
      return res.status(404).send({
        message: 'No posting with that identifier has been found'
      });
    }

    req.posting = posting;
    next();
  });
};

/**
 * Posting middleware
 */
exports.mailChainByOfferingId = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'PostingId is invalid'
    });
  }

  Posting.where('offeringId').equals(req.offeringId).populate('sender','displayName').exec(function (err, postings) {
    if (err) {
      return next(err);
    } else if (!postings) {
      return res.status(404).send({
        message: 'No posting with that identifier has been found'
      });
    }
    req.postings = postings;
    next();
  });
};
