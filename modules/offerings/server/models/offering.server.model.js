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
  // WARNING: The admin 'delete user' functionality has a dependency on the ownerId
  // field below, as it needs to delete all offerings from a user when the user is deleted.
  ownerId: { // Partial repeat of user._id, to allow filtering without populating sub-documents
    type: String,
    default: '',
    trim: true,
    required: 'ownerId cannot be blank'
  }
});

// Create index on geo location, matching is done first by
// proximity to request, then filtered further by other fields.
OfferingSchema.index({ loc: '2dsphere' });
// Create a second index for the userId field, this can be used when
// a user wants to list all of their offerings
OfferingSchema.index({ ownerId: 1 });

OfferingSchema.statics.mapOfferTypeNumberToString = function (offerType) {
  if (offerType === 0) {
    return 'offer';
  } else if (offerType === 1) {
    return 'request';
  } else if (offerType === 2) {
    return 'offer (expired)';
  } else if (offerType === 3) {
    return 'request (expired)';
  } else {
    // unsupported states or unknown errors
    return 'unknown';
  }
};

OfferingSchema.statics.mapOfferTypeStringToNumber = function(offerType) {
  if (offerType === 'offer') {
    return 0;
  } else if (offerType === 'request') {
    return 1;
  } else if (offerType === 'offer (expired)') {
    return 2;
  } else if (offerType === 'request (expired)') {
    return 3;
  } else {
    // unsupported states or unknown errors
    return -1;
  }
};

/**
 * Static schema method to return only public portions of a user profile.
 */
OfferingSchema.statics.getPublicObject = function (rawDoc, myOwnDoc, includeDistance) {
  var pubOffering = {
    _id: rawDoc._id,
    whenString: rawDoc.when.toUTCString(),
    updatedString: rawDoc.updated.toUTCString(),
    category: rawDoc.category,
    description: rawDoc.description,
    descriptionLanguage: rawDoc.descriptionLanguage,
    descriptionEnglish: rawDoc.descriptionEnglish,
    descriptionOther: rawDoc.descriptionOther,
    numOffered: rawDoc.numOffered,
    expiryString: new Date(rawDoc.expiry).toUTCString(),
    offerType: this.mapOfferTypeNumberToString(rawDoc.offerType),
    city: rawDoc.city
  };

  if (myOwnDoc === true) {
    // this is my own document, we can show exact co-ordinates in results
    pubOffering.longitude = rawDoc.loc.coordinates[0];
    pubOffering.latitude = rawDoc.loc.coordinates[1];
  }
  // Only return the publicly-accessible portion of the user sub-document.
  if (rawDoc.user && rawDoc.user._id) {
    pubOffering.user = rawDoc.user.getPublicObject();
  } else {
    pubOffering.user = rawDoc.user;
  }
  if (includeDistance === true) {
    pubOffering.distance = Math.round(rawDoc.distance * 100) / 100;
  }
  return pubOffering;
};

/**
 * Instance method to return only public/client-side portions of an offering object.
 */
OfferingSchema.methods.getPublicObject = function (myOwnDoc) {
  return this.constructor.getPublicObject(this, myOwnDoc, false);
};

mongoose.model('Offering', OfferingSchema);
