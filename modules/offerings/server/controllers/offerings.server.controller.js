/* indent: 0 */
'use strict';

function mapOfferTypeStringToNumber(offerType) {
  if (offerType === 'offer') {
    return 0;
  } else if (offerType === 'request') {
    return 1;
  }
  else if (offerType === 'offer (expired)') {
    return 2;
  } else if (offerType === 'request (expired)') {
    return 3;
  }
  // unsupported states or unknown errors
  return -1;
}

function mapOfferTypeNumberToString(offerType) {
  if (offerType === 0) {
    return 'offer';
  } else if (offerType === 1) {
    return 'request';
  }
  else if (offerType === 2) {
    return 'offer (expired)';
  }
  else if (offerType === 3) {
    return 'request (expired)';
  }
  // unsupported states or unknown errors
  return 'unknown';
}

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Offering = mongoose.model('Offering'),
  watson = require('watson-developer-cloud'),
  config = require(path.resolve('./config/config')),
  extend = require('util')._extend,
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

//Get the local username & password if running locally.

 var languageCredentials = extend({
    version: 'v2',
    username: '<username>',
    password: '<password>'
  }, config.utils.getServiceCreds('language_translation')); //VCAP_SERVICES


 var language_translation = watson.language_translation(languageCredentials); // User language translation service

/*var language_translation = watson.language_translation({
  username: '0771b667-54c2-4010-8dcd-9eed53194136',
  password: 'IeBtcoZy6hgH',
  version: 'v2'
});
*/
// Translation method

function doTranslate(text_translate,trans_result)
{
    language_translation.translate({
      text: text_translate, source : 'ar', target: 'en' },
      function (err, result) {
        if (err) {
          console.log('error:', err);
        }
        else {
          trans_result(result.translations[0].translation);  
          console.log('The JSON value is' + result.translations[0].translation);  
        }
      }); 
}
/**
 * Create a offering
 */
exports.create = function (req, res) {
  var offering = new Offering();
  offering.user = req.user;
  offering.userId = req.user._id;
  //console.log('Liam pre: ' + req.body.when);
  offering.when = new Date(req.body.when);
  //console.log('Liam post1: ' + offering.when);
  offering.updated = new Date();
  offering.expiry = req.body.expiry;
  //offering.description = req.body.description;
  // TODO: Need to call the translation services to convert from the
  // input language to English
  offering.descriptionLanguage = 'en';
  offering.description= req.body.description;
  offering.descriptionDetails = req.body.descriptionDetails;
  offering.descriptionDetailsEnglish = req.body.descriptionDetailsEnglish;
  offering.city = req.body.city;
  offering.category = req.body.category;
  offering.loc.type = 'Point';
  offering.loc.coordinates = [ Number(req.body.longitude),
                               Number(req.body.latitude) ];
  offering.offerType = mapOfferTypeStringToNumber(req.body.offerType);
  offering.numOffered = req.body.numOffered ? Number(req.body.numOffered) : 1;
  offering.offerType = mapOfferTypeToBoolean(req.body.offerType);
  doTranslate(req.body.description,function(trans_offering){
    console.log('The trans_offering is '+trans_offering);
    offering.descriptionEnglish = trans_offering;
    offering.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        //console.log('Liam post2: ' + offering.when);
        //console.log('Liam post3: ' + JSON.stringify(offering));
        res.json(offering);
      }
    });
  });
  
};

/**
 * Show the current offering
 */
exports.read = function (req, res) {
  res.json(req.offering);
};

/**
 * Update a offering
 */
exports.update = function (req, res) {
  var offering = req.offering;

  offering.when = new Date(req.body.when);
  offering.updated = new Date();
  offering.description = req.body.description;
  offering.city = req.body.city;
  offering.category = req.body.category;
  offering.loc.type = 'Point';
  offering.loc.coordinates = [ Number(req.body.longitude),
                               Number(req.body.latitude) ];
  offering.offerType = mapOfferTypeStringToNumber(req.body.offerType);

  offering.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(offering);
    }
  });
};

/**
 * Delete an offering
 */
exports.delete = function (req, res) {
  var offering = req.offering;

  offering.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(offering);
    }
  });
};

function buildGeoNearAggregateRestriction(req) {
  var restrictQuery = {};
  // TODO: The additional fields that can/should be used for the query are:
  // req.body.description -- description of the offering the user is searching for
  // req.body.when -- date the user is interested in receiving offers for
  // req.body.city -- open question, should we allow searching by city when no coords are provided???
  restrictQuery.maxDistance = req.query.radius*1000;
  restrictQuery.spherical = true;
  restrictQuery.distanceMultiplier = 1/1000;
  // if any categories were selected, restrict on those
  if (req.query.category) {
    var searchCategories = [];
    if (typeof req.query.category === 'string') {
      searchCategories.push(req.query.category);
    } else {
      searchCategories = req.query.category;
    }
    restrictQuery.query = { category: { $in: searchCategories } };
  }
  if (req.query.offerType) {
    var offerTypeRestrict = mapOfferTypeStringToNumber(req.query.offerType);
    if (restrictQuery.query) {
      restrictQuery.query.offerType = offerTypeRestrict;
    } else {
      restrictQuery.query = { offerType: offerTypeRestrict };
    }
  }
  var nearPoint = { type : 'Point', coordinates : [ Number(req.query.longitude), Number(req.query.latitude) ] };
  restrictQuery.near = nearPoint;
  restrictQuery.distanceField = 'distance';
  return restrictQuery;
}

function filterSingleInternalOfferingFields(rawDoc, myOwnDoc, includeDistance) {
  var tmpRes = {};
  tmpRes._id = rawDoc._id;
  tmpRes.displayName = rawDoc.user.displayName;
  if (myOwnDoc === true) {
    tmpRes.user = rawDoc.user;
  } else {
    tmpRes.user = { _id : rawDoc.user._id,
                    displayName : rawDoc.user.displayName };
  }
  tmpRes.when = rawDoc.when;
  tmpRes.updated = rawDoc.updated;
  tmpRes.category = rawDoc.category;
  tmpRes.description = rawDoc.description;
  tmpRes.numOffered = rawDoc.numOffered;
  tmpRes.expiry = rawDoc.expiry;
  tmpRes.offerType = mapOfferTypeNumberToString(rawDoc.offerType);
  if (myOwnDoc === true) {
    // this is my own document, we can show exact co-ordinates in results
    tmpRes.city = rawDoc.city + ' (@' + rawDoc.loc.coordinates[1] + ',' + rawDoc.loc.coordinates[0] + ')';
  } else {
    tmpRes.city = rawDoc.city;
  }
  if (includeDistance === true) {
    tmpRes.distance = Math.round(rawDoc.distance * 100) / 100;
  }
  return tmpRes;
}

function filterInternalOfferingFields(rawDocs, myOwnDoc, includeDistance) {
  var filteredResults = [];
  rawDocs.forEach(function(rawDoc) {
    filteredResults.push(filterSingleInternalOfferingFields(rawDoc, myOwnDoc, includeDistance));
  });
  return filteredResults;
}

/**
 * List of Offerings
 */
exports.listMine = function (req, res) {
  var Query = (req.user) ? { userId: req.user._id } : {};

  if (req.query.radius) {
    // We were passed in fields implying a record-search should be performed.
    var restriction = buildGeoNearAggregateRestriction(req);
    // Run the query, and then do some post-query filtering
    Offering.aggregate([
      { '$geoNear': restriction },
      { '$skip': 0 },
      { '$limit': 25 },
      { '$sort': { 'distance': 1 } } // Sort the nearest first
    ], function(err,offerings) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
        // Populate the display name of the user that created this offering.
        Offering.populate(offerings, { path: 'user', select: 'displayName' }, function(err,docs) {
          if (err) {
            return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
          } else {
            //console.log('RAW RESULTS: ' + JSON.stringify(docs));
            // restrict results to only public-viewable fields
            var publicResults = filterInternalOfferingFields(docs, false, true);
            //console.log('RETURNING: ' + JSON.stringify(publicResults));
            // TODO: Need to implement translation services, so description
            // matches the language desired by the user.
            res.json(publicResults);
          }
        });
      }
    });
  } else {
    // Build up query, depending on whether the user is authenticated or not.  Authenticated
    // users are returned a list of all their offerings.  Non-authenticated users get
    // a sampling of 5 (random) offerings - the limit is to reduce load on the server.
    // Note that currently only unit tests call this without authentication, normally
    // non-authenticated users go through the search path above.
    var query = Offering.find({});
    if (req.user) {
      query.where('userId', req.user._id);
      query.sort('-created');
    } else {
      query.limit(5);
    }
    query.populate('user');

    query.exec(function (err, offerings) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        // console.log('RAW RESULTS for ' + JSON.stringify(Query) + ' : ' + JSON.stringify(offerings));
        // restrict results to only public-viewable fields
        var publicResults = filterInternalOfferingFields(offerings, true, false);
        // Note - these results do not go through translation services, they are
        // returned the same way the user entered them.
        res.json(publicResults);
      }
    });
  }
};

/**
 * Offering middleware
 */
exports.offeringByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Offering is invalid'
    });
  }

  Offering.findById(id).populate('user', 'displayName').exec(function (err, offering) {
    if (err) {
      return next(err);
    } else if (!offering) {
      return res.status(404).send({
        message: 'No offering with that identifier has been found'
      });
    }
    // TODO: The filtering here seems to cause a 'Forbidden' error when trying
    // to edit your own offering.  Comment out for now, until this 'Forbidden'
    // error is fixed.  Alternatively, if there's no easy way to fix that, we
    // can return the un-filtered offering if it matches the current user, and
    // only filter when other users are searching for matching offers (that
    // feature already works with this filtering enabled).
    // req.offering = filterSingleInternalOfferingFields(offering, (req.user && req.user._id === offering.userId), false);
    req.offering = offering;
    next();
  });
};
