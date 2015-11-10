'use strict';

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
  offering.when = req.body.when;
  offering.updated = new Date();
  offering.description = req.body.description;
  offering.city = req.body.city;
  offering.category = req.body.category;
  offering.loc.type = 'Point';
  offering.loc.coordinates = [ Number(req.body.longitude),
                               Number(req.body.latitude) ];
  offering.offerType = req.body.offerType;

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

  offering.when = req.body.when;
  offering.updated = new Date();
  offering.description = req.body.description;
  offering.city = req.body.city;
  offering.category = req.body.category;
  offering.loc.type = 'Point';
  offering.loc.coordinates = [ Number(req.body.longitude),
                               Number(req.body.latitude) ];
  offering.offerType = req.body.offerType;

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

/**
 * List of Offerings
 */
exports.listMine = function (req, res) {
  Offering.find().sort('-created').populate('user', 'displayName').exec(function (err, offerings) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(offerings);
    }
  });
};

/**
 * Search matching offerings
 */
exports.searchAll = function (req, res) {
  // TODO: Right now, we just search based on location.  The pre-mean.js prototype also
  // restricted by search description + categories.  The following mongodb query was used:
//  db.collection('offerItem').aggregate(
//      [
//        { "$geoNear": { "near": { "type": "Point",
//                                "coordinates": [ Number((req.body.geo.lng).toFixed(6)),
//                                                 Number((req.body.geo.lat).toFixed(6)) ]},
//                        "distanceField": "distance",
//                        "distanceMultiplier": 1/1000,
//                        "maxDistance": radius,
//                        "spherical": true,
//                        query: { category: { $in: req.body.categories } },
//                      }
//        },
//        { 
//            "$sort": {"distance": 1} // Sort the nearest first
//        }
//      ]).toArray( function(err, docs) {
//            if (err) throw err;
//            db.close();
//            var matchedDocs = "[";
//            docs.forEach( function( testDoc, index) {
//              // here, need to do some matching!
//              if ( index > 0 ) {
//                matchedDocs = matchedDocs + ",";
//              }
//              testDoc.distance = Math.round(testDoc.distance * 100) / 100;
//              matchedDocs = matchedDocs + JSON.stringify(testDoc);
//            });
//            matchedDocs = matchedDocs + "]"
//      res.send(matchedDocs);
//  });
  // The additional fields that can/should be used for the query are:
  // req.body.category -- category list to restrict returned results
  // req.body.description -- description of the offering the user is searching for
  // req.body.when -- date the user is interested in receiving offers for
  // req.body.offerType -- whether the user is searching offers (1), or outstanding requests (0)
  // req.body.city -- open question, should we allow searching by city when no coords are provided???
  var nearPoint = { type : 'Point', coordinates : [ Number(req.body.longitude), Number(req.body.latitude) ] };
  Offering.geoNear(nearPoint, { maxDistance : req.body.radius*1000, spherical : true }, function(err, results, stats) {
    //console.log(results);
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // PUT request on the client expects a single json doc as response,
      // so wrap the results array into a new json document.
      var returnSearch = { 'searchResults' : results };
      res.json(returnSearch);
    }
  });
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
