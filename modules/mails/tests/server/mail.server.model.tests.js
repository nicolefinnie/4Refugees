'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Mail = mongoose.model('Mail');

/**
 * Globals
 */
var user, mail;

/**
 * Unit tests
 */
describe('Mail Model Unit Tests:', function () {

  beforeEach(function (done) {
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    });

    user.save(function () {
      mail = new Mail({
        title: 'Mail Title',
        content: 'Mail Content',
        sender: user,
        recipient: user,
        ownerId: user
      });

      done();
    });
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      return mail.save(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without title', function (done) {
      mail.title = '';

      return mail.save(function (err) {
        should.exist(err);
        done();
      });
    });
  });

  afterEach(function (done) {
    Mail.remove().exec(function () {
      User.remove().exec(done);
    });
  });
});
