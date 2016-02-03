'use strict';

var cfenv = require('cfenv'),
  socialCredentials = require('./credentials'),
  appEnv = cfenv.getAppEnv(),
  cfMongoUrl = appEnv.getService('mean-mongo') ?
  appEnv.getService('mean-mongo').credentials.url : undefined;
// Fallback in case they are trying to use the Mongolab service,
// which uses ...credentials.uri
if ((cfMongoUrl === undefined) && appEnv.getService('mean-mongo').credentials.uri) {
  cfMongoUrl = appEnv.getService('mean-mongo').credentials.uri;
}


var getCred = function (serviceName, credProp) {
  return appEnv.getService(serviceName) ?
    appEnv.getService(serviceName).credentials[credProp] : undefined;
};

module.exports = {
  port: appEnv.port,
  db: {
    uri: cfMongoUrl,
    options: {
      user: '',
      pass: ''
    },
 
  },

  log: {
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: 'combined',
    // Stream defaults to process.stdout
    // By default we want logs to go to process.out so the Cloud Foundry Loggregator will collect them
    options: {}
  },
  facebook: {
    clientID: getCred('mean-facebook', 'id') || socialCredentials.fbappID,
    clientSecret: getCred('mean-facebook', 'secret') || socialCredentials.fbappSecret,
    callbackURL: '/api/auth/facebook/callback'
  },
  twitter: {
    clientID: getCred('mean-twitter', 'key') || socialCredentials.twitterID,
    clientSecret: getCred('mean-twitter', 'secret') || socialCredentials.twitterSecret,
    callbackURL: '/api/auth/twitter/callback'
  },
  google: {
    clientID: getCred('mean-google', 'id') || socialCredentials.googleID,
    clientSecret: getCred('mean-google', 'secret') || socialCredentials.googleSecret,
    callbackURL: '/api/auth/google/callback'
  },
  linkedin: {
    clientID: getCred('mean-linkedin', 'id') || socialCredentials.linkedinID,
    clientSecret: getCred('mean-linkedin', 'secret') || socialCredentials.linkedinSecret,
    callbackURL: '/api/auth/linkedin/callback'
  },
  github: {
    clientID: getCred('mean-github', 'id') || 'APP_ID',
    clientSecret: getCred('mean-github', 'secret') || 'APP_SECRET',
    callbackURL: '/api/auth/github/callback'
  },
  paypal: {
    clientID: getCred('mean-paypal', 'id') || 'CLIENT_ID',
    clientSecret: getCred('mean-paypal', 'secret') || 'CLIENT_SECRET',
    callbackURL: '/api/auth/paypal/callback',
    sandbox: false
  },
  mailer: {
    from: getCred('mean-mail', 'from') || 'MAILER_FROM',
    options: {
      service: getCred('mean-mail', 'service') || 'MAILER_SERVICE_PROVIDER',
      auth: {
        user: getCred('mean-mail', 'username') || 'MAILER_EMAIL_ID',
        pass: getCred('mean-mail', 'password') || 'MAILER_PASSWORD'
      }
    }
  }
};
