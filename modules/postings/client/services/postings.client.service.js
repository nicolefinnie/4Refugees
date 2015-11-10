'use strict';

//Postings service used for communicating with the postings REST endpoints
angular.module('postings').factory('Postings', ['$resource',
  function ($resource) {
    return $resource('api/postings/:postingId', {
      postingId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
