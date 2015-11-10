'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Posting = mongoose.model('Posting'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, posting;

/**
 * Posting routes tests
 */
describe('Posting CRUD tests', function () {

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

    // Save a user to the test db and create new posting
    user.save(function () {
      posting = {
        title: 'Posting Title',
        content: 'Posting Content'
      };

      done();
    });
  });

  it('should be able to save an posting if logged in', function (done) {
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

        // Save a new posting
        agent.post('/api/postings')
          .send(posting)
          .expect(200)
          .end(function (postingSaveErr, postingSaveRes) {
            // Handle posting save error
            if (postingSaveErr) {
              return done(postingSaveErr);
            }

            // Get a list of postings
            agent.get('/api/postings')
              .end(function (postingsGetErr, postingsGetRes) {
                // Handle posting save error
                if (postingsGetErr) {
                  return done(postingsGetErr);
                }

                // Get postings list
                var postings = postingsGetRes.body;

                // Set assertions
                (postings[0].user._id).should.equal(userId);
                (postings[0].title).should.match('Posting Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an posting if not logged in', function (done) {
    agent.post('/api/postings')
      .send(posting)
      .expect(403)
      .end(function (postingSaveErr, postingSaveRes) {
        // Call the assertion callback
        done(postingSaveErr);
      });
  });

  it('should not be able to save an posting if no title is provided', function (done) {
    // Invalidate title field
    posting.title = '';

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

        // Save a new posting
        agent.post('/api/postings')
          .send(posting)
          .expect(400)
          .end(function (postingSaveErr, postingSaveRes) {
            // Set message assertion
            (postingSaveRes.body.message).should.match('Title cannot be blank');

            // Handle posting save error
            done(postingSaveErr);
          });
      });
  });

  it('should be able to update an posting if signed in', function (done) {
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

        // Save a new posting
        agent.post('/api/postings')
          .send(posting)
          .expect(200)
          .end(function (postingSaveErr, postingSaveRes) {
            // Handle posting save error
            if (postingSaveErr) {
              return done(postingSaveErr);
            }

            // Update posting title
            posting.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing posting
            agent.put('/api/postings/' + postingSaveRes.body._id)
              .send(posting)
              .expect(200)
              .end(function (postingUpdateErr, postingUpdateRes) {
                // Handle posting update error
                if (postingUpdateErr) {
                  return done(postingUpdateErr);
                }

                // Set assertions
                (postingUpdateRes.body._id).should.equal(postingSaveRes.body._id);
                (postingUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of postings if not signed in', function (done) {
    // Create new posting model instance
    var postingObj = new Posting(posting);

    // Save the posting
    postingObj.save(function () {
      // Request postings
      request(app).get('/api/postings')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single posting if not signed in', function (done) {
    // Create new posting model instance
    var postingObj = new Posting(posting);

    // Save the posting
    postingObj.save(function () {
      request(app).get('/api/postings/' + postingObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', posting.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single posting with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/postings/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Posting is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single posting which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent posting
    request(app).get('/api/postings/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No posting with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an posting if signed in', function (done) {
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

        // Save a new posting
        agent.post('/api/postings')
          .send(posting)
          .expect(200)
          .end(function (postingSaveErr, postingSaveRes) {
            // Handle posting save error
            if (postingSaveErr) {
              return done(postingSaveErr);
            }

            // Delete an existing posting
            agent.delete('/api/postings/' + postingSaveRes.body._id)
              .send(posting)
              .expect(200)
              .end(function (postingDeleteErr, postingDeleteRes) {
                // Handle posting error error
                if (postingDeleteErr) {
                  return done(postingDeleteErr);
                }

                // Set assertions
                (postingDeleteRes.body._id).should.equal(postingSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an posting if not signed in', function (done) {
    // Set posting user
    posting.user = user;

    // Create new posting model instance
    var postingObj = new Posting(posting);

    // Save the posting
    postingObj.save(function () {
      // Try deleting posting
      request(app).delete('/api/postings/' + postingObj._id)
        .expect(403)
        .end(function (postingDeleteErr, postingDeleteRes) {
          // Set message assertion
          (postingDeleteRes.body.message).should.match('User is not authorized');

          // Handle posting error error
          done(postingDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Posting.remove().exec(done);
    });
  });
});
