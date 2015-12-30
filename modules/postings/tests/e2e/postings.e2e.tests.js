'use strict';

describe('Postings E2E Tests:', function () {

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

  var signout = function () {
    // Make sure user is signed out first
    browser.get('http://localhost:3001/authentication/signout');
    // Delete all cookies
    browser.driver.manage().deleteAllCookies();
  };

  describe('Test postings page', function () {
    it('Should report missing credentials', function () {

      //Make sure user is signed out first
      signout();

      browser.get('http://localhost:3001/postings');
      expect(element.all(by.repeater('posting in postings')).count()).toEqual(0);

    });

    it('Verify that the user is logged in', function() {
      //Make sure user is signed out first
      signout();
      //Sign in
      browser.get('http://localhost:3001/authentication/signin');
      // Enter UserName
      element(by.model('credentials.username')).sendKeys(user1.username);
      // Enter Password
      element(by.model('credentials.password')).sendKeys(user1.password);
      // Click Submit button
      element(by.css('button[type="submit"]')).click();
      expect(browser.getCurrentUrl()).toEqual('http://localhost:3001/');
    });

  });
});
