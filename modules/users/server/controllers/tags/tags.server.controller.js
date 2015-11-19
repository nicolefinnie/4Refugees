'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
//  multer = require('multer'),
//  config = require(path.resolve('./config/config')),
  Tags = mongoose.model('Tags');

/**
 * Send tags
 */
exports.get = function (req, res) {
  res.json(req.tags || null);
};
