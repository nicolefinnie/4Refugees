'use strict';

/**
 * Module dependencies.
 */
var postingsPolicy = require('../policies/postings.server.policy'),
  postings = require('../controllers/postings.server.controller');

module.exports = function (app) {
  // Postings collection routes
  app.route('/api/postings').all(postingsPolicy.isAllowed)
    .get(postings.list)
    .post(postings.create);

  // Single posting routes
  app.route('/api/postings/:postingId').all(postingsPolicy.isAllowed)
    .get(postings.read)
    .put(postings.update)
    .delete(postings.delete);

  // Finish by binding the posting middleware
  app.param('postingId', postings.postingByID);
};
