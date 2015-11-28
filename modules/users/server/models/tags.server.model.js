'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Tags Schema
 */
var TagsSchema = new Schema({
  tags: [{
    tagName : String,
    value : String
  }]
});

mongoose.model('Tags', TagsSchema);
