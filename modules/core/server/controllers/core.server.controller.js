'use strict';

/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
  res.render('modules/core/server/views/index', {
    user: req.user || null
  });
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
  res.status(500).render('modules/core/server/views/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {

  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    'default': function () {
      res.send('Path not found');
    }
  });
};

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Location = mongoose.model('Location'),
  config = require(path.resolve('./config/config')),
  extend = require('util')._extend,
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));


exports.listlocations = function (req, res) {
  var Query = (req.user) ? { userId: req.user._id } : {};
  console.log('RAW RESULTS: ');

  // restrict to german places for now
  Location.find({ 'countrycode':'DE' }, {}, { 'sort' : 'name' }, function(err,locations) {
  //Location.find({ 'countrycode':'DE' }, function(err,locations) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      //console.log('RAW RESULTS: ' + JSON.stringify(locations));
      // restrict results to only public-viewable fields
      res.json(locations);
    }
  });
};

exports.create = function (req, res) {
};

exports.read = function (req, res) {
};

exports.update = function (req, res) {
};

exports.delete = function (req, res) {
};

exports.locationByID = function (req, res) {
};

