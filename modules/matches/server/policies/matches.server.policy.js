'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Matches Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/matches',
      permissions: '*'
    }, {
      resources: '/api/matches/:matchId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/matches',
      permissions: ['get', 'post', 'put']
    }, {
      resources: '/api/matches/:matchId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/matches',
      permissions: ['']
    }, {
      resources: '/api/matches/:matchId',
      // TODO: Block this?
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Matches Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If a match is being processed and the current user is associated with
  // the match then allow any manipulation.
  // Note - use toString() instead of direct '===' comparison, since the
  // match coming in may be filtered/reconstructed, and no longer the
  // native mongodb 'ObjectId' type.
  if (req.user && req.user._id && req.match &&
      ((req.match.owner && req.match.owner._id && req.match.owner._id.toString() === req.user._id.toString()) ||
       (req.match.requester && req.match.requester._id && req.match.requester._id.toString() === req.user._id.toString()))) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred.
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
