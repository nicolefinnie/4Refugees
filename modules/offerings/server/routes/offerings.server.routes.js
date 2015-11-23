'use strict';

/**
 * Module dependencies.
 */
var offeringsPolicy = require('../policies/offerings.server.policy'),
  offerings = require('../controllers/offerings.server.controller');

module.exports = function (app) {
  // Offerings collection routes
  app.route('/api/offerings').all(offeringsPolicy.isAllowed)
    .get(offerings.listMine)
    .post(offerings.create);

  // Single offering routes
  app.route('/api/offerings/:offeringId').all(offeringsPolicy.isAllowed)
    .get(offerings.read)
    .put(offerings.update)
    .delete(offerings.delete);

  // Finish by binding the offering middleware
  app.param('offeringId', offerings.offeringByID);
};
