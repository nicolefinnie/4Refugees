'use strict';

/**
 * Module dependencies.
 */
var locationsPolicy = require('../policies/core.server.policy'),
  locations = require('../controllers/core.server.controller');

module.exports = function (app) {
  // Root routing
  var core = require('../controllers/core.server.controller');

  // Location collection routes
  app.route('/api/locations').all(locationsPolicy.isAllowed)
    .get(locations.listlocations)
    .post(locations.create);

  // Single location routes
  app.route('/api/locations/:locationId').all(locationsPolicy.isAllowed)
    .get(locations.read)
    .put(locations.update)
    .delete(locations.delete);

  // Finish by binding the location middleware
  app.param('locationId', locations.locationByID);
  // Define error pages
  app.route('/server-error').get(core.renderServerError);

  // Return a 404 for all undefined api, module or lib routes
  app.route('/:url(api|modules|lib)/*').get(core.renderNotFound);

  // Define application route
  app.route('/*').get(core.renderIndex);

};

