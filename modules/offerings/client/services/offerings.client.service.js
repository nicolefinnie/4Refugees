'use strict';

//Offerings service used for communicating with the offerings REST endpoints
angular.module('offerings').factory('Offerings', ['$resource',
  function ($resource) {
    return $resource('api/offerings/:offeringId', {
      offeringId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
