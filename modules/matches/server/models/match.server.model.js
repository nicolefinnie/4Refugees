'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Match Schema
 */
var MatchSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  },
  offering: {
    type: Schema.ObjectId,
    ref: 'Offering'
  },
  owner: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  requester: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  ownerState: {
    lastMessage: {
      type: String,
      default: '',
      trim: true
    },
    updated: {
      type: Date,
      default: Date.now
    },
    seen: {
      type: Boolean,
      default: false
    },
    blockContact: {
      type: Boolean,
      default: false
    },
    acceptMatch: {
      type: Boolean,
      default: false
    },
    rejectMatch: {
      type: Boolean,
      default: false
    }
  },
  requesterState: {
    lastMessage: {
      type: String,
      default: '',
      trim: true
    },
    updated: {
      type: Date,
      default: Date.now
    },
    blockContact: {
      type: Boolean,
      default: false
    },
    withdrawRequest: {
      type: Boolean,
      default: false
    }
  },
  offeringId: { // Partial repeat of offering._id, to allow filtering without populating sub-documents
    type: String,
    default: '',
    trim: true,
    required: 'offeringId cannot be blank'
  },
  requesterId: { // Partial repeat of requester._id, to allow filtering without populating sub-documents
    type: String,
    default: '',
    trim: true,
    required: 'requesterId cannot be blank'
  },
  // WARNING: The admin 'delete user' functionality has a dependency on the ownerId
  // field below, as it needs to delete all matches owned by a user when the user is deleted.
  ownerId: { // Partial repeat of owner._id, to allow filtering without populating sub-documents
    type: String,
    default: '',
    trim: true,
    required: 'ownerId cannot be blank'
  }
});

// Create an index for the ownerId, requesterId, and offeringId fields, these can
// be used when a user wants to list all of their matches
MatchSchema.index({ ownerId: 1 });
MatchSchema.index({ requesterId: 1 });
MatchSchema.index({ offeringId: 1 });

/**
 * Instance method to return only public/client-side portions of a match object.
 */
MatchSchema.methods.getPublicObject = function() {
  var pubMatch = {
    _id: this._id,
    created: this.created,
    updated: this.updated,
    ownerState: this.ownerState,
    requesterState: this.requesterState,
    offeringId: this.offeringId,
    requesterId: this.requesterId,
    ownerId: this.ownerId
  };
  if (this.offering && this.offering._id) {
    pubMatch.offering = this.offering.getPublicObject(false);
  } else {
    pubMatch.offering = this.offering;
  }
  if (this.owner && this.owner._id) {
    pubMatch.owner = this.owner.getPublicObject();
  } else {
    pubMatch.owner = this.owner;
  }
  if (this.requester && this.requester._id) {
    pubMatch.requester = this.requester.getPublicObject();
  } else {
    pubMatch.requester = this.requester;
  }
  return pubMatch;
};

mongoose.model('Match', MatchSchema);
