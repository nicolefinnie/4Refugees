'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Offering = mongoose.model('Offering'),
  Match = mongoose.model('Match'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, owner, offering, match;

/**
 * Match routes tests
 */
describe('Match CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Create a new user
    owner = new User({
      firstName: 'Owner',
      lastName: 'Name',
      displayName: 'Owner Name',
      email: 'test@owner.com',
      username: 'ownername',
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new match
    user.save(function () {
      owner.save(function () {
        offering = new Offering({
          description: 'Match description',
          city: 'Match city',
          loc: { type: 'Point', coordinates : [ Number(8.8), Number(9.9) ] },
          user: owner,
          ownerId: owner.displayName
        });
        offering.save(function () {
          match = new Match({
            'ownerId': owner._id.toString(),
            'offeringId': offering._id.toString(),
            'requesterId': user._id.toString()
          });
          done();
        });
      });
    });
  });

  it('should be able to save a match if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new match
        agent.post('/api/matches')
          .send(match)
          .expect(200)
          .end(function (matchSaveErr, matchSaveRes) {
            // Handle match save error
            if (matchSaveErr) {
              return done(matchSaveErr);
            }

            // Get a list of matches
            agent.get('/api/matches')
              .end(function (matchesGetErr, matchesGetRes) {
                // Handle match save error
                if (matchesGetErr) {
                  return done(matchesGetErr);
                }

                // Get matches list
                var matches = matchesGetRes.body;

                // Set assertions
                (matches[0].requester._id).should.equal(userId);
                // TODO: Validate other fields, like offeringId?

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save a match if not logged in', function (done) {
    agent.post('/api/matches')
      .send(match)
      .expect(403)
      .end(function (matchSaveErr, matchSaveRes) {
        // Call the assertion callback
        done(matchSaveErr);
      });
  });

  it('should not be able to save a match if an invalid ownerId is provided', function (done) {
    // invalid offeringId
    match.ownerId = '123456789012';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new match
        agent.post('/api/matches')
          .send(match)
          .expect(400)
          .end(function (matchSaveErr, matchSaveRes) {
            // Set message assertion
            (matchSaveRes.body.message).should.match('No owner with that identifier has been found');

            // Handle match save error
            done(matchSaveErr);
          });
      });
  });

  it('should not be able to save a match if an invalid offeringId is provided', function (done) {
    // invalid offeringId
    match.offeringId = '123456789012';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new match
        agent.post('/api/matches')
          .send(match)
          .expect(400)
          .end(function (matchSaveErr, matchSaveRes) {
            // Set message assertion
            (matchSaveRes.body.message).should.match('No offering with that identifier has been found');

            // Handle match save error
            done(matchSaveErr);
          });
      });
  });

  it('should be able to update an match if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new match
        agent.post('/api/matches')
          .send(match)
          .expect(200)
          .end(function (matchSaveErr, matchSaveRes) {
            // Handle match save error
            if (matchSaveErr) {
              return done(matchSaveErr);
            }

            // Update match title
            match.requesterState.lastMessage = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing match
            agent.put('/api/matches/' + matchSaveRes.body._id)
              .send(match)
              .expect(200)
              .end(function (matchUpdateErr, matchUpdateRes) {
                // Handle match update error
                if (matchUpdateErr) {
                  return done(matchUpdateErr);
                }

                // Set assertions
                (matchUpdateRes.body._id).should.equal(matchSaveRes.body._id);
                (matchUpdateRes.body.requesterState.lastMessage).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to get a list of matches if not signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {

        // Create new match model instance
        var matchObj = new Match(match);
        matchObj.ownerId = owner._id.toString();
        matchObj.offeringId = offering._id.toString();
        matchObj.requesterId = user._id.toString();

        // Save the match
        matchObj.save(function (err) {
          console.log('save err ' + JSON.stringify(err));
          agent.post('/api/auth/signout')
            .end(function (signoutErr, signinRes) {

              // Request matches
              request(app).get('/api/matches')
                .expect(403)
                .end(function (matchGetErr, matchGetRes) {
                  // Set message assertion
                  (matchGetRes.body.message).should.match('User is not authorized');
        
                  // Handle match error error
                  done(matchGetErr);
                });
            });
        });
      });
  });

//  it('should be able to get a single match if not signed in', function (done) {
//    // Create new match model instance
//    var matchObj = new Match(match);
//    matchObj.user = user;
//    matchObj.ownerId = user.id;
//    matchObj.description = 'test';
//    matchObj.loc.type = 'Point';
//    matchObj.loc.coordinates = [ 10,20 ];
//
//    // Save the match
//    matchObj.save(function () {
//      request(app).get('/api/matches/' + matchObj._id)
//        .end(function (req, res) {
//          // Set assertion
//          res.body.should.be.instanceof(Object).and.have.property('description', matchObj.description);
//
//          // Call the assertion callback
//          done();
//        });
//    });
//  });
//
//  it('should return proper error for single match with an invalid Id, if not signed in', function (done) {
//    // test is not a valid mongoose Id
//    request(app).get('/api/matches/test')
//      .end(function (req, res) {
//        // Set assertion
//        res.body.should.be.instanceof(Object).and.have.property('message', 'Match is invalid');
//
//        // Call the assertion callback
//        done();
//      });
//  });
//
//  it('should return proper error for single match which doesnt exist, if not signed in', function (done) {
//    // This is a valid mongoose Id but a non-existent match
//    request(app).get('/api/matches/559e9cd815f80b4c256a8f41')
//      .end(function (req, res) {
//        // Set assertion
//        res.body.should.be.instanceof(Object).and.have.property('message', 'No match with that identifier has been found');
//
//        // Call the assertion callback
//        done();
//      });
//  });
//
//  it('should be able to delete an match if signed in', function (done) {
//    agent.post('/api/auth/signin')
//      .send(credentials)
//      .expect(200)
//      .end(function (signinErr, signinRes) {
//        // Handle signin error
//        if (signinErr) {
//          return done(signinErr);
//        }
//
//        // Get the userId
//        var userId = user.id;
//
//        // Save a new match
//        agent.post('/api/matches')
//          .send(match)
//          .expect(200)
//          .end(function (matchSaveErr, matchSaveRes) {
//            // Handle match save error
//            if (matchSaveErr) {
//              return done(matchSaveErr);
//            }
//
//            // Delete an existing match
//            agent.delete('/api/matches/' + matchSaveRes.body._id)
//              .send(match)
//              .expect(200)
//              .end(function (matchDeleteErr, matchDeleteRes) {
//                // Handle match error error
//                if (matchDeleteErr) {
//                  return done(matchDeleteErr);
//                }
//
//                // Set assertions
//                (matchDeleteRes.body._id).should.equal(matchSaveRes.body._id);
//
//                // Call the assertion callback
//                done();
//              });
//          });
//      });
//  });
//
//  it('should not be able to delete an match if not signed in', function (done) {
//    // Set match user
//    match.user = user;
//
//    // Create new match model instance
//    var matchObj = new Match(match);
//    matchObj.user = user;
//    matchObj.ownerId = user.id;
//    matchObj.description = 'test';
//    matchObj.loc.type = 'Point';
//    matchObj.loc.coordinates = [ 10,20 ];
//
//    // Save the match
//    matchObj.save(function () {
//      // Try deleting match
//      request(app).delete('/api/matches/' + matchObj._id)
//        .expect(403)
//        .end(function (matchDeleteErr, matchDeleteRes) {
//          // Set message assertion
//          (matchDeleteRes.body.message).should.match('User is not authorized');
//
//          // Handle match error error
//          done(matchDeleteErr);
//        });
//
//    });
//  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Match.remove().exec(done);
    });
  });
});
