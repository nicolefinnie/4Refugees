/* indent: 0 */
'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Offering = mongoose.model('Offering'),
  translater = require(path.resolve('./modules/language/server/watson/language.server.watson.translation')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));


// Helper function to translate, save, and return an offering
function doTranslateOfferingAndSave(offering, res) {
  var translateInput = {
    substituteOnFailure: true,
    sourceLanguage: offering.title[0].language,
    sourceText: offering.title[0].text
  };
  translater.translateAllLanguages(translateInput, function(translationOutput) {
    translationOutput.targets.forEach(function(translation) {
      var translatedTitle = {
        language: translation.language,
        text: translation.text
      };
      offering.title.push(translatedTitle);
    });
    offering.save(function (err) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
        var filteredOffering = Offering.getPublicObject(offering, true, false);
        res.json(filteredOffering);
      }
    });
  });
}

/**
 * Re-build indexes.  geoNear queries require an index to be created, and
 * mongoose only creates indexes at startup.  So, if the offerings collection
 * is dropped, the indexes won't be rebuilt until startup, causing all geoNear
 * queries to fail with a 16604 error code until the app is restarted.  To
 * workaround this, rebuild the indexes manually if errors are encountered.
 */
function rebuildOfferingIndexes() {
  Offering.ensureIndexes(function(err) {
    if (err) { 
      console.log('Offering: error rebuilding indexes: ' + err); 
    } else {
      console.log('Offering: indexes re-built succesfully.');
    } 
  });
}

/**
 * Create a offering
 */
exports.create = function (req, res) {
  var offering = new Offering();
  if(!req.body.title || !req.body.title[0] || !req.body.title[0].language || !req.body.title[0].text) {
    return res.status(400).send({ message: 'Description cannot be blank' });
  }
  offering.user = req.user;
  offering.ownerId = req.user._id.toString();
  offering.when = new Date(req.body.whenString);
  var now = new Date(); 
  offering.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  offering.expiry = new Date(req.body.expiryString);
  offering.title = [];
  offering.title.push(req.body.title[0]);
  offering.city = req.body.city;
  offering.category = req.body.category;
  offering.loc.type = 'Point';
  offering.loc.coordinates = [ Number(req.body.longitude),
                               Number(req.body.latitude) ];
  offering.offerType = Offering.mapOfferTypeStringToNumber(req.body.offerType);
  offering.numOffered = req.body.numOffered ? Number(req.body.numOffered) : 1;
  doTranslateOfferingAndSave(offering, res);

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
  if(!req.body.title || !req.body.title[0] || !req.body.title[0].language || !req.body.title[0].text) {
    return res.status(400).send({ message: 'Description cannot be blank' });
  }
  Offering.findOne({ _id: mongoose.Types.ObjectId(req.offering._id) }, function (err, offering){
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      offering.user = req.user;
      offering.ownerId = req.user._id.toString();
      offering.when = new Date(req.body.whenString);
      var now = new Date(); 
      offering.updated = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      offering.expiry = new Date(req.body.expiryString);
      // TODO: Clear old description* fields for now, remove these after official
      // site has migrated all offerings to new schema.
      offering.description = undefined;
      offering.descriptionLanguage = undefined;
      offering.descriptionEnglish = undefined;
      offering.descriptionOther = undefined;
      offering.city = req.body.city;
      offering.category = req.body.category;
      offering.loc.type = 'Point';
      offering.loc.coordinates = [ Number(req.body.longitude),
                                   Number(req.body.latitude) ];

      if (offering.title[0].text === req.body.title[0].text) {
        // no need to translate again, text has not changed, just save directly.
        offering.save(function (err) {
          if (err) {
            return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
          } else {
            var filteredOffering = Offering.getPublicObject(offering, true, false);
            res.json(filteredOffering);
          }
        });
      } else {
        // Set the title for the source language, and translate to other supported languages
        offering.title = [];
        offering.title.push(req.body.title[0]);
        doTranslateOfferingAndSave(offering, res);
      }
    }
  });
};

/**
 * Delete an offering
 */
exports.delete = function (req, res) {
  Offering.remove({ _id: mongoose.Types.ObjectId(req.offering._id) }, function(err) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      res.json(req.offering);
    }
  });
};

function buildGeoNearAggregateRestriction(req) {
  var restrict = {};
  var queryDate = new Date(req.query.whenString);
  var nearPoint = { type : 'Point', coordinates : [ Number(req.query.longitude), Number(req.query.latitude) ] };
 
  // Restrict to valid offerings on specified date
  restrict.query = { numOffered: { $gt: 0 } };
  restrict.query.when = { $lte: queryDate };
  restrict.query.expiry = { $gte: queryDate };

  // if any categories were selected, restrict on those
  if (req.query.category) {
    var searchCategories = [];
    if (typeof req.query.category === 'string') {
      searchCategories.push(req.query.category);
    } else {
      searchCategories = req.query.category;
    }
    restrict.query.category = { $in: searchCategories };
  }

  // restrict to search either offerings or requests
  if (req.query.offerType) {
    var offerTypeRestrict = Offering.mapOfferTypeStringToNumber(req.query.offerType);
    restrict.query.offerType = offerTypeRestrict;
  }

  // add geo-near restrictions
  restrict.maxDistance = req.query.radius*1000;
  restrict.spherical = true;
  restrict.distanceMultiplier = 1/1000;
  restrict.near = nearPoint;
  restrict.distanceField = 'distance';

  return restrict;
}

function filterInternalOfferingFields(rawDocs, myOwnDoc, includeDistance) {
  var filteredResults = [];
  rawDocs.forEach(function(rawDoc) {
    // Skip invalid offerings that do not have any associated user
    if (rawDoc.user && rawDoc.user._id) {
      filteredResults.push(Offering.getPublicObject(rawDoc, myOwnDoc, includeDistance));
    }
  });
  return filteredResults;
}

/**
 * Handle migrating all docs from an old OfferingSchema to the current OfferingSchema.
 */
function adminOfferingMigrateSchema(offerings) {
  var numMigrated = 0;
  offerings.forEach(function(offering) {
    if (offering.description && offering.description.length > 0) {
      numMigrated = numMigrated + 1;
      var enTitle = {
        language: 'en',
        text: offering.descriptionEnglish
      };
      var arTitle = {
        language: 'ar',
        text: offering.descriptionOther
      };
      var deTitle = {
        language: 'de',
        text: offering.description
      };
      if (offering.descriptionLanguage === 'de') {
        // No german translation support, just use un-translated values for English and Arabic
        enTitle.text = offering.description;
        arTitle.text = offering.description;
      } else {
        if (offering.descriptionLanguage === 'en') {
          enTitle.text = offering.description;
        } else {
          arTitle.text = offering.description;
        }
        // No german translation support, just use English version
        deTitle.text = enTitle.text;
      }
      offering.title = [];
      offering.title.push(enTitle);
      offering.title.push(arTitle);
      offering.title.push(deTitle);
      offering.description = undefined;
      offering.descriptionLanguage = undefined;
      offering.descriptionEnglish = undefined;
      offering.descriptionOther = undefined;
      // no need to translate again, text has not changed, just save directly.
      offering.save(function (err) {
        if (err) {
          console.log('Offering: Admin: Error saving migrated offering \'' + offering.title[0].text + '\', error: ' + JSON.stringify(err));
        }
      });
    }
  });
  console.log('Offering: Admin: Migrated ' + numMigrated + ' out of ' + offerings.length + ' offerings to new schema.');
}

/**
 * Handle deleting all docs from the OfferingSchema.
 */
function adminOfferingDeleteAll(req, res) {
  Offering.remove({}, function(err, removed) {
    if (err) {
      console.log('Offering: Admin: error deleting all offerings: ' + err);
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    } else {
      console.log('Offering: Admin: All offerings removed: ' + removed);
      rebuildOfferingIndexes();
      var results = [];
      res.json(results);
    }
  });
}

/**
 * Administrative functionality commands, req.query.adminRequest:
 * 'list' -> list all offerings
 * 'migrate_schema' -> convert offerings from old schema to new schema
 * 'delete_all' -> remove all offerings
 */
function handleAdminRequests(req, res) {
  console.log('Offering: Admin: \'' + req.query.adminRequest + '\' request issued');

  if ((req.query.adminRequest === 'list') ||
      (req.query.adminRequest === 'migrate_schema')) {
    var listQuery = Offering.find({});
    listQuery.sort('-created');
    listQuery.populate('user');
    listQuery.exec(function (err, offerings) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
        if (req.query.adminRequest === 'migrate_schema') {
          adminOfferingMigrateSchema(offerings);
        }
        // else, list request, just return current results

        // restrict results to only public-viewable fields
        var publicResults = filterInternalOfferingFields(offerings, false, false);
        res.json(publicResults);
      }
    });
  } else if (req.query.adminRequest === 'delete_all') {
    adminOfferingDeleteAll(req, res);
  } else {
    console.log('Offering: Admin: \'' + req.query.adminRequest + '\' request not supported.');
  }
}

/**
 * List of Offerings
 */
exports.listMine = function (req, res) {

  if (req.query.adminRequest) {
    if (!req.user || !req.user.roles || (req.user.roles.indexOf('admin') < 0)) {
      return res.status(403).json({ message: 'User is not authorized' });
    } else {
      handleAdminRequests(req, res);
    }
  } else if (req.query.radius) {
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
        // On error, try to rebuild the index, required by geoNear, so hopefully
        // the next attempt will succeed.
        rebuildOfferingIndexes();
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
        // Populate the display name of the user that created this offering.
        Offering.populate(offerings, { path: 'user' }, function(err,docs) {
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
    // Build up query, depending on whether the user is authenticated or not.  Authenticated
    // users are returned a list of all their offerings.  Non-authenticated users get
    // a sampling of 5 (random) offerings - the limit is to reduce load on the server.
    // Note that currently only unit tests call this without authentication, normally
    // non-authenticated users go through the search path above.
    var query = Offering.find({});
    if (req.user) {
      query.where('ownerId', req.user._id.toString());
      query.sort('-created');
    } else {
      query.limit(5);
    }
    query.populate('user');

    query.exec(function (err, offerings) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      } else {
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
    return res.status(400).send({ message: 'Offering is invalid' });
  }

  Offering.findById(id).populate('user').exec(function (err, offering) {
    if (err) {
      return next(err);
    } else if (!offering) {
      return res.status(404).send({ message: 'No offering with that identifier has been found' });
    }
    var myDoc = (req.user && req.user._id && req.user._id.toString() === offering.user._id.toString());
    req.offering = offering.getPublicObject(myDoc);
    next();
  });
};
