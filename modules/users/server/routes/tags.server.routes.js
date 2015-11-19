'use strict';

module.exports = function (app) {
  // User Routes
  var tags = require('../controllers/tags.server.controller');

  // Setting up the tags profile api
  app.route('/api/tags').get(tags.get);

};
