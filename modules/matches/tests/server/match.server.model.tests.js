'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Offering = mongoose.model('Offering'),
  Match = mongoose.model('Match');

/**
 * Globals
 */
var owner, offering, user, match;

/**
 * Unit tests
 */
describe('Match Model Unit Tests:', function () {

  beforeEach(function (done) {
    owner = new User({
      firstName: 'Owner',
      lastName: 'Name',
      displayName: 'Owner Name',
      email: 'test@owner.com',
      username: 'owner',
      password: 'M3@n.jsI$Aw3$0m3'
    });

    user = new User({
      firstName: 'Requester',
      lastName: 'Name',
      displayName: 'Requester Name',
      email: 'test@requester.com',
      username: 'requester',
      password: 'M3@n.jsI$Aw3$0m3'
    });

    offering = new Offering({
      description: 'Match description',
      city: 'Match city',
      loc: { type: 'Point', coordinates : [ Number(8.8), Number(9.9) ] },
      user: owner,
      ownerId: owner.displayName
    });

    user.save(function () {
      owner.save(function (response) {
        offering.save(function (response) {
          match = new Match({
            'ownerId': owner._id.toString(),
            'offeringId': offering._id.toString(),
            'requesterId': user._id.toString()
          });
        });
  
        done();
      });
    });
  });

  describe('Method Save', function () {
    it('should be able to save without problems', function (done) {
      this.timeout(10000);
      return match.save(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without offering', function (done) {
      match.offeringId = '';

      return match.save(function (err) {
        should.exist(err);
        done();
      });
    });
  });

  afterEach(function (done) {
    Match.remove().exec(function () {
      User.remove().exec(done);
    });
  });
});
