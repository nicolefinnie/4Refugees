'use strict';

function mapOfferTypeToBoolean(offerType) {
  if (offerType === 'offer') {
    return 0;
  } else if (offerType === 'request') {
    return 1;
  }
  // unsupported states or unknown errors
  return -1;
}
/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Offering = mongoose.model('Offering'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Create a offering
 */
exports.create = function (req, res) {
  var offering = new Offering();
  offering.user = req.user;
  offering.userId = req.user._id;
  console.log('Liam pre: ' + req.body.when);
  offering.when = new Date(req.body.when);
  console.log('Liam post1: ' + offering.when);
  offering.updated = new Date();
  offering.description = req.body.description;
  offering.city = req.body.city;
  offering.category = req.body.category;
  offering.loc.type = 'Point';
  offering.loc.coordinates = [ Number(req.body.longitude),
                               Number(req.body.latitude) ];
  offering.offerType = mapOfferTypeToBoolean(req.body.offerType);

  offering.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      console.log('Liam post2: ' + offering.when);
      console.log('Liam post3: ' + JSON.stringify(offering));
      res.json(offering);
    }
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
  offering.offerType = mapOfferTypeToBoolean(req.body.offerType);

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
  // req.body.offerType -- whether the user is searching offers (1), or outstanding requests (0)
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
  var nearPoint = { type : 'Point', coordinates : [ Number(req.query.longitude), Number(req.query.latitude) ] };
  restrictQuery.near = nearPoint;
  restrictQuery.distanceField = 'distance';
  return restrictQuery;
}

function filterInternalOfferingFields(rawDocs, myOwnDoc, includeDistance) {
  var filteredResults = [];
  rawDocs.forEach(function(rawDoc) {
    var tmpRes = {};
    tmpRes._id = rawDoc._id;
    tmpRes.displayName = rawDoc.user.displayName;
    tmpRes.when = rawDoc.when;
    tmpRes.updated = rawDoc.updated;
    tmpRes.category = rawDoc.category;
    tmpRes.description = rawDoc.description;
    if (myOwnDoc === true) {
      // this is my own document, we can show exact co-ordinates in results
      tmpRes.city = rawDoc.city + ' (@' + rawDoc.loc.coordinates[1] + ',' + rawDoc.loc.coordinates[0] + ')';
    } else {
      tmpRes.city = rawDoc.city;
    }
    if (includeDistance === true) {
      tmpRes.distance = Math.round(rawDoc.distance * 100) / 100;
    }
    filteredResults.push(tmpRes);
  });
  return filteredResults;
}

/**
 * List of Offerings
 */
exports.listMine = function (req, res) {
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
            res.json(publicResults);
          }
        });
      }
    });
  } else {
    // list all of my offerings
    Offering.find({ userId: req.user._id }).sort('-created').populate('user', 'displayName').exec(function (err, offerings) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        //console.log('RAW RESULTS: ' + JSON.stringify(offerings));
        // restrict results to only public-viewable fields
        var publicResults = filterInternalOfferingFields(offerings, true, false);
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
    req.offering = offering;
    next();
  });
};
