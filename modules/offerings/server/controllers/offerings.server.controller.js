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
  if (req.query.description) {
    // We were passed in fields implying a record-search should be performed.
    // TODO: The additional fields that can/should be used for the query are:
    // req.body.description -- description of the offering the user is searching for
    // req.body.when -- date the user is interested in receiving offers for
    // req.body.offerType -- whether the user is searching offers (1), or outstanding requests (0)
    // req.body.city -- open question, should we allow searching by city when no coords are provided???
    var restrictQuery = {};
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
    //console.log('restrictQuery is: ' + JSON.stringify(restrictQuery));
    // Run the query, and then do some post-query filtering
    Offering.aggregate([
      { '$geoNear': restrictQuery },
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
            var publicResults = [];
            docs.forEach(function(doc) {
              var tmpRes = {};
              tmpRes.distance = Math.round(doc.distance * 100) / 100;
              tmpRes.displayName = doc.user.displayName;
              tmpRes.when = doc.when;
              tmpRes.updated = doc.updated;
              tmpRes.category = doc.category;
              tmpRes.description = doc.description;
              tmpRes.city = doc.city;
              publicResults.push(tmpRes);
            });
            //console.log('RETURNING: ' + JSON.stringify(publicResults));
            res.json(publicResults);
          }
        });
      }
    });
  } else {
    // list all of my offerings
    // TODO: This should be restricted to just the current user's offerings
    Offering.find().sort('-created').populate('user', 'displayName').exec(function (err, offerings) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(offerings);
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
