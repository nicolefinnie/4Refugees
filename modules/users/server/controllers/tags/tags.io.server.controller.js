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
 * Get tags from DB
 */
exports.get = function (req, res) {
  console.log('DEBUG API \'/api/tags\' was called');
  res.json(Tags || null);
  console.log('DEBUG : return is : ' + res.json);
  console.log('DEBUG : return is : ' + req.tags);
};

exports.put = function (req, res) {
  Tags.save(function(err){
    if(err)
      console.log(err);
    else
      console.log(Tags);
  });
};