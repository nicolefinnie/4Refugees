'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Posting = mongoose.model('Posting'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a posting
 */
exports.create = function (req, res) {
  var posting = new Posting();
  posting.user = req.user;
  posting.updated = new Date();
  posting.title = req.body.title;
  posting.content = req.body.content;
  posting.offeringId = req.body.offeringId;
  posting.replyTo = req.body.postingId;

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
 * Update a posting, usually only replyTo when creating a reply
 */
exports.update = function (req, res) {
  var posting = req.posting;

  posting.replyTo = req.body.postingId;

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
  Posting.find().sort('-created').populate('user', 'displayName').populate('recipient', 'diplayName').exec(function (err, postings) {
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
  Posting.find({ 'recipient' : req.user }).sort('-created').populate('user', 'displayName').populate('recipient', 'diplayName').exec(function (err, postings) {
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
 * List of New Postings
 */
exports.listnew = function (req, res) {
  Posting.find({ 'recipient' : req.user }).sort('-created').populate('user', 'displayName').exec(function (err, postings) {
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
 * Posting middleware
 */
exports.postingByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'PostingId is invalid'
    });
  }

  Posting.findById(id).populate('user', 'displayName').exec(function (err, posting) {
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

  Posting.where('offeringId').equals(req.offeringId).populate('user','displayName').exec(function (err, postings) {
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
