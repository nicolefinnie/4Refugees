'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Location Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/locations',
      permissions: '*'
    }, {
      resources: '/api/locations/:locationId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/locations',
      permissions: ['get', 'post', 'put']
    }, {
      resources: '/api/locations/:locationId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/locations',
      permissions: ['get']
    }, {
      resources: '/api/locations/:locationId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Location Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an location is being processed and the current user created it then allow any manipulation
  // Note - use toString() instead of direct '===' comparison, since the
  // location coming in may be filtered/reconstructed, and no longer the
  // native mongodb 'ObjectId' type.
  if (req.location && req.location.user && req.location.user._id &&
      req.user && req.user._id &&
      req.location.user._id.toString() === req.user._id.toString()) {
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
