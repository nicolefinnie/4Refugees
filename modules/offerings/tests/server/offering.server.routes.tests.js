'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Offering = mongoose.model('Offering'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, offering;

/**
 * Offering routes tests
 */
describe('Offering CRUD tests', function () {

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

    // Save a user to the test db and create new offering
    user.save(function () {
      offering = {
        title: [{
          language: 'en',
          text: 'Offering description'
        }],
        city: 'Offering city',
        longitude: '8.8',
        latitude: '9.9',
        user: user
      };

      done();
    });
  });

  it('should be able to save an offering if logged in', function (done) {
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

        // Save a new offering
        agent.post('/api/offerings')
          .send(offering)
          .expect(200)
          .end(function (offeringSaveErr, offeringSaveRes) {
            // Handle offering save error
            if (offeringSaveErr) {
              return done(offeringSaveErr);
            }

            // Get a list of offerings
            agent.get('/api/offerings')
              .end(function (offeringsGetErr, offeringsGetRes) {
                // Handle offering save error
                if (offeringsGetErr) {
                  return done(offeringsGetErr);
                }

                // Get offerings list
                var offerings = offeringsGetRes.body;

                // Set assertions
                (offerings[0].user._id).should.equal(userId);
                (offerings[0].title[0].text).should.match('Offering description');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an offering if not logged in', function (done) {
    agent.post('/api/offerings')
      .send(offering)
      .expect(403)
      .end(function (offeringSaveErr, offeringSaveRes) {
        // Call the assertion callback
        done(offeringSaveErr);
      });
  });

  it('should not be able to save an offering if no description is provided', function (done) {
    // Invalidate geo location type field
    offering.title = [];

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

        // Save a new offering
        agent.post('/api/offerings')
          .send(offering)
          .expect(400)
          .end(function (offeringSaveErr, offeringSaveRes) {
            // Set message assertion
            (offeringSaveRes.body.message).should.match('Description cannot be blank');

            // Handle offering save error
            done(offeringSaveErr);
          });
      });
  });

  it('should be able to update an offering if signed in', function (done) {
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

        // Save a new offering
        agent.post('/api/offerings')
          .send(offering)
          .expect(200)
          .end(function (offeringSaveErr, offeringSaveRes) {
            // Handle offering save error
            if (offeringSaveErr) {
              return done(offeringSaveErr);
            }

            // Update offering title
            offering.title[0].text = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing offering
            agent.put('/api/offerings/' + offeringSaveRes.body._id)
              .send(offering)
              .expect(200)
              .end(function (offeringUpdateErr, offeringUpdateRes) {
                // Handle offering update error
                if (offeringUpdateErr) {
                  return done(offeringUpdateErr);
                }

                // Set assertions
                (offeringUpdateRes.body._id).should.equal(offeringSaveRes.body._id);
                (offeringUpdateRes.body.title[0].text).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of offerings if not signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {

        // Create new offering model instance
        var offeringObj = new Offering(offering);
        offeringObj.user = user;
        offeringObj.ownerId = user.id;
        offeringObj.title = [{
          language: 'en',
          text: 'test'
        }];
        offeringObj.loc.type = 'Point';
        offeringObj.loc.coordinates = [ 10,20 ];

        // Save the offering
        offeringObj.save(function (err) {
          //console.log('save err ' + JSON.stringify(err));
          agent.post('/api/auth/signout')
            .end(function (signoutErr, signinRes) {

              // Request offerings
              request(app).get('/api/offerings')
                .end(function (req, res) {
                  // Set assertion
                  res.body.should.be.instanceof(Array).and.have.lengthOf(1);

                  // Call the assertion callback
                  done();
                });
            });
        });
      });
  });

  it('should be able to get a single offering if not signed in', function (done) {
    // Create new offering model instance
    var offeringObj = new Offering(offering);
    var offeringTitle = [{
      language: 'en',
      text: 'test'
    }];
    offeringObj.user = user;
    offeringObj.ownerId = user.id;
    offeringObj.title = offeringTitle;
    offeringObj.loc.type = 'Point';
    offeringObj.loc.coordinates = [ 10,20 ];

    // Save the offering
    offeringObj.save(function () {
      request(app).get('/api/offerings/' + offeringObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', offeringTitle);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single offering with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/offerings/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Offering is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single offering which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent offering
    request(app).get('/api/offerings/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No offering with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an offering if signed in', function (done) {
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

        // Save a new offering
        agent.post('/api/offerings')
          .send(offering)
          .expect(200)
          .end(function (offeringSaveErr, offeringSaveRes) {
            // Handle offering save error
            if (offeringSaveErr) {
              return done(offeringSaveErr);
            }

            // Delete an existing offering
            agent.delete('/api/offerings/' + offeringSaveRes.body._id)
              .send(offering)
              .expect(200)
              .end(function (offeringDeleteErr, offeringDeleteRes) {
                // Handle offering error error
                if (offeringDeleteErr) {
                  return done(offeringDeleteErr);
                }

                // Set assertions
                (offeringDeleteRes.body._id).should.equal(offeringSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an offering if not signed in', function (done) {
    // Set offering user
    offering.user = user;

    // Create new offering model instance
    var offeringObj = new Offering(offering);
    offeringObj.user = user;
    offeringObj.ownerId = user.id;
    offeringObj.title = [{
      language: 'en',
      text: 'test'
    }];
    offeringObj.loc.type = 'Point';
    offeringObj.loc.coordinates = [ 10,20 ];

    // Save the offering
    offeringObj.save(function () {
      // Try deleting offering
      request(app).delete('/api/offerings/' + offeringObj._id)
        .expect(403)
        .end(function (offeringDeleteErr, offeringDeleteRes) {
          // Set message assertion
          (offeringDeleteRes.body.message).should.match('User is not authorized');

          // Handle offering error error
          done(offeringDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Offering.remove().exec(done);
    });
  });
});
