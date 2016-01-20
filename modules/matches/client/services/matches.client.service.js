'use strict';

//Matches service used for communicating with the matches REST endpoints
angular.module('matches').factory('Matches', ['$resource',
  function ($resource) {
    return $resource('api/matches/:matchId', {
      matchId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
