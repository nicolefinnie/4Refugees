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
  // Array of offering titles, and details, translated into all supported languages
  // Each entry should contain 'language' and 'text' fields.
  title: [{}],
  details: [{}],
  url: {
    type: String,
    default: '',
    trim: true
  },
  // Note: description, descriptionLanguage, descriptionEnglish, descriptionOther
  // are deprecated, replaced with the 'title' array
  description: {
    type: String,
    default: '',
    trim: true
  },
  descriptionLanguage: {
    type: String,
    default: '',
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

// Validate that there is at least one title/description, and that for all provided
// titles/descriptions, both mandatory fields are provided.
OfferingSchema.path('title').validate(function(title){
  var valid = (title && title.length > 0);
  title.forEach(function(translation) {
    if (valid === true) {
      valid = (translation.language && translation.text && (translation.text.length > 0) && (translation.language.length > 0));
    }
  });
  return (valid);
}, 'Description cannot be blank');

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
    title: rawDoc.title,
    details: rawDoc.details,
    url: rawDoc.url,
    numOffered: rawDoc.numOffered,
    expiryString: new Date(rawDoc.expiry).toUTCString(),
    offerType: this.mapOfferTypeNumberToString(rawDoc.offerType),
    city: rawDoc.city
  };

  // TODO: Remove this after all offering objects are migrated to new schema
  if (rawDoc.description && rawDoc.description !== '') {
    var enTitle = {
      language: 'en',
      text: rawDoc.descriptionEnglish
    };
    var arTitle = {
      language: 'ar',
      text: rawDoc.descriptionOther
    };
    var deTitle = {
      language: 'de',
      text: rawDoc.description
    };
    if (rawDoc.descriptionLanguage === 'de') {
      // No german translation support, just use un-translated values for English and Arabic
      enTitle.text = rawDoc.description;
      arTitle.text = rawDoc.description;
    } else {
      if (rawDoc.descriptionLanguage === 'en') {
        enTitle.text = rawDoc.description;
      } else {
        arTitle.text = rawDoc.description;
      }
      // No german translation support, just use English version
      deTitle.text = enTitle.text;
    }
    pubOffering.title = [];
    pubOffering.title.push(enTitle);
    pubOffering.title.push(arTitle);
    pubOffering.title.push(deTitle);
  }

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

/**
 * Instance method to accept an offering match - decrements the remaining number offered.
 * After saving, the callback will be issued, passing back any error as well as update results from Mongoose.
 */
OfferingSchema.methods.acceptMatchAndSave = function (callback) {
  var newNumOffered = (this.numOffered > 0) ? (this.numOffered - 1) : 0;
  this.numOffered = newNumOffered;
  this.constructor.update({ _id: this._id }, { $set: { numOffered: newNumOffered } }, function (err, updateResults) {
    callback(err, updateResults);
  });
};

mongoose.model('Offering', OfferingSchema);
