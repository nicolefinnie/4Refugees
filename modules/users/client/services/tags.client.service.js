'use strict';

//Tags service used for communicating with the tags REST endpoint
angular.module('core').factory('Tags', ['$resource',
  function ($resource) {
    return $resource('api/tags', {
      method: 'GET'
    });
  }

  function ($resource) {
    return $resource('api/tags/save', {
      method: 'PUT'
    });
  }
]);