'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Posting Schema
 */
var PostingSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    default: '',
    trim: true,
    required: 'Title cannot be blank'
  },
  content: {
    type: String,
    default: '',
    trim: true
  },
  unread: {
    type: Boolean,
    default: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  offeringId: {
    type: Schema.ObjectId,
    ref: 'Offering'
  },
  replyTo: {
    type: Schema.ObjectId,
    ref: 'Posting'
  }
});

mongoose.model('Posting', PostingSchema);
