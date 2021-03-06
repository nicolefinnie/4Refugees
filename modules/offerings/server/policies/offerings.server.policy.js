'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Offerings Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/offerings',
      permissions: '*'
    }, {
      resources: '/api/offerings/:offeringId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/offerings',
      permissions: ['get', 'post', 'put']
    }, {
      resources: '/api/offerings/:offeringId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/offerings',
      permissions: ['get']
    }, {
      resources: '/api/offerings/:offeringId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Offerings Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an offering is being processed and the current user created it then allow any manipulation
  // Note - use toString() instead of direct '===' comparison, since the
  // offering coming in may be filtered/reconstructed, and no longer the
  // native mongodb 'ObjectId' type.
  if (req.offering && req.offering.user && req.offering.user._id &&
      req.user && req.user._id &&
      req.offering.user._id.toString() === req.user._id.toString()) {
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
