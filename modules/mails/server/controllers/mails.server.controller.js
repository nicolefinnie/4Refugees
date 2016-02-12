'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  url = require('url'),
  mongoose = require('mongoose'),
  Mail = mongoose.model('Mail'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a mail
 */
exports.create = function (req, res) {
  var mail = new Mail();
  mail.sender = req.user;
  mail.updated = new Date();
  mail.title = req.body.title;
  mail.content = req.body.content;
  mail.recipient = req.body.recipient;
  mail.replyTo = req.body.replyTo;

  // support reporting offending entries like offerings and emails
  mail.reportAdmin = req.body.reportAdmin;

  // check whether recipient is valid, if not replace it with the user
  // allow self sending of mails to make e2e testing easier and to make 
  // the mail module more robust
  var recUser;
  if (mail.recipient) {
    recUser = User.findById(mail.recipient, '-salt -password');
  }
  if (!recUser) mail.recipient = mail.sender._id;

  mail.matchId = req.body.matchId;
  // The recipient is the owner of the email, only they can delete it.
  // This ownerId is also used when deleting a user, to delete all their mails.
  mail.ownerId = mail.recipient.toString();

  mail.save(function (err) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      var filteredMail = mail.getPublicObject();
      res.json(filteredMail);
    }
  });
};

/**
 * Show the current mail
 */
exports.read = function (req, res) {
  res.json(req.mail);
};

/**
 * Update a mail - not used yet, only to keep grunt test happy
 */
exports.update = function (req, res) {
  Mail.findOne({ _id: mongoose.Types.ObjectId(req.mail._id) }, function (err, mail){
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else if (!mail) {
      return res.status(400).send({ message: 'No mail with that identifier has been found' });
    } else {
      if (req.body.title) {
        mail.title = req.body.title;
      }
      if (req.body.content) {
        mail.content = req.body.content;
      }
      mail.replyTo = req.body.mailId;

      mail.save(function (err) {
        if (err) {
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        } else {
          var filteredMail = mail.getPublicObject();
          res.json(filteredMail);
        }
      });
    }
  });
};

/**
 * Delete a mail - might create dangling replyTo
 */
exports.delete = function (req, res) {
  Mail.remove({ _id: mongoose.Types.ObjectId(req.mail._id) }, function(err) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      res.json(req.mail);
    }
  });
};

/**
 * Helper function to filter out sensitive/internal fields from an array of documents.
 */
function filterInternalMailFields(rawDocs) {
  var filteredResults = [];
  rawDocs.forEach(function(rawDoc) {
    // Skip invalid mails that do not have a recipient
    if (rawDoc.recipient && rawDoc.recipient._id) {
      filteredResults.push(rawDoc.getPublicObject());
    }
  });
  return filteredResults;
}

/**
 * List of all Mails - admin
 */
exports.listall = function (req, res) {
  var query = (req.user.roles.indexOf('admin') > -1) ? {} : { 'ownerId' : req.user._id.toString() };

  Mail.find(query).sort('-created').populate('sender').populate('recipient').populate('matchId').exec(function (err, mails) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      var publicResults = filterInternalMailFields(mails);
      res.json(publicResults);
    }
  });
};


/**
 * List of Mails
 */
exports.list = function (req, res) {

  var query = url.parse(req.url, true).query;
  
  if (!req.user) {
    return res.status(400).send({ message: errorHandler.getErrorMessage('no user') });
  }

  query.ownerId = req.user._id.toString();
  query.recipient = req.user._id;
 
  if (query.unread === 'true') {
    query.unread = true;
  } else if (query.unread === 'false') {
    query.unread = false;
  }
  
  var reset = false;
  if (query.reset) {
    reset = query.reset;
    delete query.reset;
  }

  var limit = 0;
  if (query.limit) {
    limit = query.limit;
    delete query.limit;
  }


  if (query.countOnly === 'true') {
    // Client just wanted a count, to avoid cost of populating and sending all docs
    delete query.countOnly;
    Mail.count(query, function (err, count) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
        var result = [{ numResults: count }];
        res.json(result);
      }
    });
  } else {
    Mail.find(query).sort('-created').limit(limit).populate('sender').populate('recipient').populate('matchId').exec(function (err, mails) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
        var publicResults = filterInternalMailFields(mails);
        
        res.json(publicResults);
  
        if (reset) {
          // mark mails read - even for admins only for their specific id
          Mail.update(query,{ 'unread': false },{ multi: true }).exec(function(err, res) {
            console.log('mark mail read result: ' + JSON.stringify(res));
          });
        }
      }
    });
  }
      
};

/**
 * Mail middleware
 */
exports.mailByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Mail is invalid' });
  }

  Mail.findById(id).populate('sender').populate('recipient').exec(function (err, mail) {
    if (err) {
      return next(err);
    } else if (!mail) {
      return res.status(404).send({ message: 'No mail with that identifier has been found' });
    }

    req.mail = mail.getPublicObject();
    next();
  });
};

/**
 * Mail middleware
 */
exports.mailChainByMatchId = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'MailId is invalid' });
  }

  Mail.where('matchId').equals(req.matchId).populate('sender').exec(function (err, mails) {
    if (err) {
      return next(err);
    } else if (!mails) {
      return res.status(404).send({ message: 'No mail with that identifier has been found' });
    }
    req.mails = filterInternalMailFields(mails);
    next();
  });
};
