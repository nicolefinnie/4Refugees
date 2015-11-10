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
  description: {
    type: String,
    default: '',
    trim: true,
    required: 'Description cannot be blank'
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
    default: 0     // 0 for request, 1 for offering
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

// Create index on geo location, matching is done first by
// proximity to request, then filtered further by other fields.
OfferingSchema.index({ loc: '2dsphere' });

mongoose.model('Offering', OfferingSchema);
