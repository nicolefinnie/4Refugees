'use strict';

var request = require('request'), http = require('http'), async = require('async');

describe('Mails E2E Tests:', function () {

  // in preparation create a test user and an email for this test user
  var myJar = request.jar();

  var user1 = {
    firstName: 'test',
    lastName: 'user',
    email: 'test.user@meanjs.com',
    username: 'testUser',
    password: 'P@$$w0rd!!'
  };

  var user2 = {
    firstName: 'test',
    lastName: 'user2',
    email: 'test.user2@meanjs.com',
    username: 'testUser2',
    password: 'P@$$w0rd!!'
  };

  var signupAndCreateMail = function () {
    console.log('signup');

    var sessionId, sessionIdArr;

    var options = {
      method: 'POST',
      url: 'http://localhost:3001/api/auth/signup',
      //headers: { 'id': 'AQ8WHWC', 'sessionid': 'XnINW5KDQg=', 'Accept': 'application/json', 'Accept-Language': 'en-us', 'random': 'BS3P5Q' },
      json: { 'firstName':'test','lastName':'user','email':'4refugees.ibm@gmail.com','username':'testUser','password':'P@$$w0rd!!' },
      jar: myJar
    };

    function callbackCM(error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log('createMail responded with ' + response.statusCode);
        //if (body) console.log('with ' + JSON.stringify(body));
      }
      else console.log('createMail error ' + response.statusCode);
    }

    function callbackSU(error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log('signup responded with ' + response.statusCode);

        console.log('Now createMail');

        var options = {
          method: 'POST',
          url: 'http://localhost:3001/api/mails',
          //headers: { 'id': 'AQ8WHWC', 'sessionid': sessionId, 'Accept': 'application/json', 'Accept-Language': 'en-us', 'random': 'BS3P5Q' },
          json: { 'title':'test','content':'user','recipient':'1' },
          jar: myJar
        };

        request(options, callbackCM);

      }
      else console.log('signup error ' + response.statusCode);
    }

    request(options, callbackSU);
  };

  var signin = function () {
    //browser.post('http://localhost:3001/authentication/signout');
    console.log('signin');

    var options = {
      method: 'POST',
      url: 'http://localhost:3001/api/auth',
      headers: { 'id': 'AQ8WHWC', 'sessionid': 'XnINW5KDQg=', 'Accept': 'application/json', 'Accept-Language': 'en-us', 'random': 'BS3P5Q' },
      json: { 'username':'testUser','password':'P@$$w0rd!!' }
    };

    function callback(error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log('signin responded with ' + response.statusCode);
        //if (body) console.log('with ' + JSON.stringify(body));
      }
      else console.log('signin error ' + response.statusCode);
    }
    request(options, callback);
  };

  var signout = function () {
    // Make sure user is signed out first
    browser.get('http://localhost:3001/authentication/signout');
    // Delete all cookies
    browser.driver.manage().deleteAllCookies();
  };

  describe('Test mails page', function () {
    //TODO You need to register first
    it('Should report missing credentials', function () {

      // Now create user and logon, then create initial mail
      signupAndCreateMail();

      //Make sure user is signed out first
      signout();

      browser.get('http://localhost:3001/mails');
      expect(element.all(by.repeater('mail in mails')).count()).toEqual(0);


    });

    it('Relogon and verify that the user can', function() {
      //Sign in
      browser.get('http://localhost:3001/authentication/signin');

      // Test case borrowed from User area - browser session must be logged in before having access to email
      // Click advanced option to make all elements visible
      element(by.id('toggle-signin-area')).click();

      element(by.model('credentials.username')).sendKeys(user1.username);
      // Enter Password
      element(by.model('credentials.password')).sendKeys(user1.password);
      // Click Submit button
      element(by.css('button[type="submit"]')).click();

      browser.get('http://localhost:3001/mails');

      expect(browser.getCurrentUrl()).toEqual('http://localhost:3001/mails');
      expect(element.all(by.repeater('mail in mails')).count()).toEqual(1);
    });

    it('Verify that user can open the details modal', function() {
      browser.get('http://localhost:3001/mails');

      // open the details modal
      element(by.id('mailDetails.0')).click();
      //browser.pause();

      browser.wait(function(){
        return element(by.id('mailDetailsDone')).isPresent();
      });

      browser.driver.sleep(1000);

      // close the details modal
      element(by.id('mailDetailsDone')).click();

      expect(element.all(by.repeater('mail in mails')).count()).toEqual(1);
    });

    it('Verify that user can reply to email', function() {
      browser.get('http://localhost:3001/mails');

      // open the reply modal
      element(by.id('mailReply.0')).click();

      browser.wait(function(){
        return element(by.id('mailReplySend')).isPresent();
      });

      browser.driver.sleep(1000);
      //browser.waitForAngular();

      element(by.model('title')).sendKeys('What');
      element(by.model('content')).sendKeys('the heck');

      // send reply
      element(by.id('mailReplySend')).click();

      expect(element.all(by.repeater('mail in mails')).count()).toEqual(2);
    });

    it('Verify that user can delete email', function() {
      browser.get('http://localhost:3001/mails');

      // open the reply modal
      element(by.id('mailDelete.1')).click();

      browser.driver.sleep(1000);
      //browser.waitForAngular();

      expect(element.all(by.repeater('mail in mails')).count()).toEqual(1);
    });
  });
});
