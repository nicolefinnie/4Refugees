'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Offering = mongoose.model('Offering');

/**
 * Globals
 */
var user, offering;

/**
 * Unit tests
 */
describe('Offering Model Unit Tests:', function () {

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
      offering = new Offering({
        description: 'Offering description',
        city: 'Offering city',
        loc: { type: 'Point', coordinates : [ Number(8.8), Number(9.9) ] },
        user: user,
        ownerId: user.displayName
      });

      done();
    });
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      return offering.save(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without description', function (done) {
      offering.description = '';

      return offering.save(function (err) {
        should.exist(err);
        done();
      });
    });
  });

  afterEach(function (done) {
    Offering.remove().exec(function () {
      User.remove().exec(done);
    });
  });
});
