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
  reportAdmin: {
    type: Boolean,
    default: false 
  },
  sender: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  recipient: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  matchId: {
    type: Schema.ObjectId,
    ref: 'Match'
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

/**
 * Instance method to return only public/client-side portions of a mail object.
 */
MailSchema.methods.getPublicObject = function() {
  var pubMatch = {
    _id: this._id,
    created: this.created,
    title: this.title,
    content: this.content,
    unread: this.unread,
    reportAdmin: this.reportAdmin,
    ownerId: this.ownerId
  };
  if (this.sender && this.sender._id) {
    pubMatch.sender = this.sender.getPublicObject();
  } else {
    pubMatch.sender = this.sender;
  }
  if (this.recipient && this.recipient._id) {
    pubMatch.recipient = this.recipient.getPublicObject();
  } else {
    pubMatch.recipient = this.recipient;
  }
  if (this.matchId && this.matchId._id) {
    pubMatch.matchId = this.matchId.getPublicObject();
  } else {
    pubMatch.matchId = this.matchId;
  }
  if (this.replyTo && this.replyTo._id) {
    pubMatch.replyTo = this.replyTo.getPublicObject();
  } else {
    pubMatch.replyTo = this.replyTo;
  }
  return pubMatch;
};

mongoose.model('Mail', MailSchema);
