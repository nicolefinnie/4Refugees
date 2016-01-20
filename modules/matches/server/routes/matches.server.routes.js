'use strict';

/**
 * Module dependencies.
 */
var matchesPolicy = require('../policies/matches.server.policy'),
  matches = require('../controllers/matches.server.controller');

module.exports = function (app) {
  // Matches collection routes
  app.route('/api/matches').all(matchesPolicy.isAllowed)
    .get(matches.search)
    .post(matches.create);

  // Single match routes
  app.route('/api/matches/:matchId').all(matchesPolicy.isAllowed)
    .get(matches.read)
    .put(matches.update)
    .delete(matches.delete);

  // Finish by binding the match middleware
  app.param('matchId', matches.matchByID);
};
