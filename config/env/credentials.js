'use strict';

// Rename this file to local.js for having a local configuration variables that
// will not get commited and pushed to remote repositories.
// Use it for your API keys, passwords, etc.

/* For example:

module.exports = {
  db: {
    uri: 'mongodb://localhost/local-dev',
    options: {
      user: '',
      pass: ''
    }
  },
  sessionSecret: process.env.SESSION_SECRET || 'youshouldchangethistosomethingsecret',
  facebook: {
    clientID: process.env.FACEBOOK_ID || 'APP_ID',
    clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/facebook/callback'
  }
};
*/

module.exports = {
		'fbappID': '1513322465659494',
		'fbappSecret':'4fed1213104623c900fd96bfd57043d6',
		'twitterID':'1EuGddIJblLFLniCty9fOaZ51',
		'twitterSecret': 'OKFhbkGf3IhwlZFDM6Hn2ghL3TFJUZH6IaaX2L9BwJsUUI7Nvu',
		'googleID': '235357693317-5fgvlmecs7edfbhgkt9o0d42mtpdqfr9.apps.googleusercontent.com',
		'googleSecret': 'MOE_aaBYiAJf0gZdK2NGw2mX',
		'linkedinID': '770mzyuf8k7ul6',
		'linkedinSecret': '0r9Xa7LVpHi82YKe'
};
