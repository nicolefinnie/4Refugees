'use strict';

//Tags service used for communicating with the tags REST endpoint
//REST endpoint to retrieve available tags from DB
angular.module('core').factory('Tags', ['$resource',
  function ($resource) {
    return $resource('api/tags', {
      method: 'GET'
    });
  }
]);

// REST endpoint to store tags
angular.module('core').factory('Tags', ['$resource',
  function ($resource) {
    return $resource('api/tags/save', {
      method: 'PUT'
    });
  }
]);
 