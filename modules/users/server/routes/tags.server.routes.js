'use strict';

module.exports = function (app) {
  // User Routes
  var tags = require('../controllers/tags.server.controller');

  // get up the tags from DB
  app.route('/api/tags').get(tags.get);

  // save the tags to DB
  app.route('/api/tags/save').get(tags.put);

};
