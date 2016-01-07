'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Mail Schema
 */
var MailSchema = new Schema({
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
  sender: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  recipient: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  offeringId: {
    type: Schema.ObjectId,
    ref: 'Offering'
  },
  replyTo: {
    type: Schema.ObjectId,
    ref: 'Mail'
  },
  // WARNING: The admin 'delete user' functionality has a dependency on the ownerId
  // field below, as it needs to delete all offerings from a user when the user is deleted.
  ownerId: { // Partial repeat of recipient._id, to allow filtering and indexing
    type: String,
    default: '',
    trim: true,
    required: 'ownerId cannot be blank'
  }
});

// Create an index on the recipient ID (owner ID), to speed up both searches
// for all my emails, as well as to delete all emails from a particular user.
MailSchema.index({ ownerId: 1 });

mongoose.model('Mail', MailSchema);
