'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Offering Schema
 */
var OfferingSchema = new Schema({
  when: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  },
  expiry: {
    type: Date,
    default: function() { return +new Date() + 28*24*60*60*1000; } // default expiry + ~1 month
  },
  description: {
    type: String,
    default: '',
    trim: true,
    required: 'Description cannot be blank'
  },
  descriptionLanguage: {
    type: String,
    default: 'en',
    trim: true
  },
  descriptionEnglish: {
    type: String,
    default: '',
    trim: true,
  },
  // We only support 3 languages, 'descriptionOther' will store the non-English and
  // non-descriptionLanguage version.
  descriptionOther: {
    type: String,
    default: '',
    trim: true,
  },
  descriptionDetails: {
    type: String,
    default: '',
    trim: true
  },
  descriptionDetailsEnglish: {
    type: String,
    default: '',
    trim: true
  },
  descriptionDetailsOther: {
    type: String,
    default: '',
    trim: true
  },
  city: {
    type: String,
    default: '',
    trim: true
  },
  category: [String],
  loc: {
    type: {
      type: String
    },
    coordinates: []
  },
  offerType: {
    type: Number,
    default: 0 // 0 for request, 1 for offering, 2 for expired request, 3 for expired offering
  },
  numOffered: {
    type: Number,
    default: 1
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  userId: { // Partial repeat of user._id, to allow filtering without populating sub-documents
    type: String,
    default: '',
    trim: true,
    required: 'user _id cannot be blank'
  }
});

// Create index on geo location, matching is done first by
// proximity to request, then filtered further by other fields.
OfferingSchema.index({ loc: '2dsphere' });
// Create a second index for the userId field, this can be used when
// a user wants to list all of their offerings
OfferingSchema.index({ userId: 1 });

mongoose.model('Offering', OfferingSchema);
