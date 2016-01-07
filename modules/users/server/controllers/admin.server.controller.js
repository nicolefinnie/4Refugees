'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Mail = mongoose.model('Mail'),
  Offering = mongoose.model('Offering'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Update a User
 */
exports.update = function (req, res) {
  var user = req.model;

  //For security purposes only merge these parameters
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.displayName = user.firstName + ' ' + user.lastName;
  user.roles = req.body.roles;

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * Delete a user
 */
exports.delete = function (req, res) {
  var user = req.model;

  // Remove user's mails and offerings prior to deleting the user
  Mail.remove({ 'ownerId' : user._id.toString() }, function(err, removed) {
    if (err) {
      console.log('Admin: error (ignored) removing all mails from deleted user - ' + user.displayName + '. removed: ' + removed + ', err: ' + JSON.stringify(err));
    } else {
      console.log('Admin: succesfully removed ' + removed + ' mails from ' + user.displayName);
    }
    Offering.remove({ 'ownerId' : user._id.toString() }, function(err, removed) {
      if (err) {
        console.log('Admin: error (ignored) removing all offerings from deleted user - ' + user.displayName + '. removed: ' + removed + ', err: ' + JSON.stringify(err));
      } else {
        console.log('Admin: succesfully removed ' + removed + ' offerings from ' + user.displayName);
      }

      // Now that we've removed all mails and offerings, delete the user.
      user.remove(function (err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        res.json(user);
      });
    });
  });
  
};

/**
 * List of Users
 */
exports.list = function (req, res) {
  User.find({}, '-salt -password').sort('-created').populate('user', 'displayName').exec(function (err, users) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(users);
  });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findById(id, '-salt -password').exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load user ' + id));
    }

    req.model = user;
    next();
  });
};
