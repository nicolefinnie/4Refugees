'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Mail = mongoose.model('Mail'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, sendUser, mail;

/**
 * Mail routes tests
 */
describe('Mail CRUD tests', function () {

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

    sendUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      email: 'john@doe.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new mail
    user.save(function () {
      sendUser.save(function () {
        mail = {
          title: 'Mail Title',
          content: 'Mail Content',
          recipient: user.id,
          ownerId: user.id
        };

        done();
      });
    });
  });

  it('should be able to save an mail if logged in', function (done) {
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
        var sendUserId = sendUser.id;

        // Save a new mail
        agent.post('/api/mails')
          .send(mail)
          .expect(200)
          .end(function (mailSaveErr, mailSaveRes) {
            // Handle mail save error
            if (mailSaveErr) {
              return done(mailSaveErr);
            }

            // Get a list of mails
            agent.get('/api/mails')
              .end(function (mailsGetErr, mailsGetRes) {
                // Handle mail save error
                if (mailsGetErr) {
                  return done(mailsGetErr);
                }

                // Get mails list
                var mails = mailsGetRes.body;

                // Set assertions
                (mails[0].sender._id).should.equal(userId);
                (mails[0].title).should.match('Mail Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an mail if not logged in', function (done) {
    agent.post('/api/mails')
      .send(mail)
      .expect(403)
      .end(function (mailSaveErr, mailSaveRes) {
        // Call the assertion callback
        done(mailSaveErr);
      });
  });

  it('should not be able to save an mail if no title is provided', function (done) {
    // Invalidate title field
    mail.title = '';

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

        // Save a new mail
        agent.post('/api/mails')
          .send(mail)
          .expect(400)
          .end(function (mailSaveErr, mailSaveRes) {
            // Set message assertion
            (mailSaveRes.body.message).should.match('Title cannot be blank');

            // Handle mail save error
            done(mailSaveErr);
          });
      });
  });

  it('should be able to update an mail if signed in', function (done) {
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

        // Save a new mail
        agent.post('/api/mails')
          .send(mail)
          .expect(200)
          .end(function (mailSaveErr, mailSaveRes) {
            // Handle mail save error
            if (mailSaveErr) {
              return done(mailSaveErr);
            }

            // Update mail title
            mail.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing mail
            agent.put('/api/mails/' + mailSaveRes.body._id)
              .send(mail)
              .expect(200)
              .end(function (mailUpdateErr, mailUpdateRes) {
                // Handle mail update error
                if (mailUpdateErr) {
                  return done(mailUpdateErr);
                }

                // Set assertions
                (mailUpdateRes.body._id).should.equal(mailSaveRes.body._id);
                (mailUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  //it('should be able to get a list of mails if not signed in', function (done) {
  it('should *NOT* be able to get a list of mails if not signed in', function (done) {
    // Create new mail model instance
    var mailObj = new Mail(mail);

    // Save the mail
    mailObj.save(function () {
      // Request mails
      request(app).get('/api/mails')
        .end(function (req, res) {
          // Set assertion
          //res.body.should.be.instanceof(Array).and.have.lengthOf(1);
          res.body.should.be.instanceof(Object).and.have.property('message', 'User is not authorized');

          // Call the assertion callback
          done();
        });

    });
  });

  //it('should be able to get a single mail if not signed in', function (done) {
  it('should *NOT* be able to get a single mail if not signed in', function (done) {
    // Create new mail model instance
    var mailObj = new Mail(mail);

    // Save the mail
    mailObj.save(function () {
      request(app).get('/api/mails/' + mailObj._id)
        .end(function (req, res) {
          // Set assertion
          //res.body.should.be.instanceof(Object).and.have.property('title', mail.title);
          res.body.should.be.instanceof(Object).and.have.property('message', 'User is not authorized');

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single mail with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/mails/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Mail is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single mail which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent mail
    request(app).get('/api/mails/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No mail with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an mail if signed in', function (done) {
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

        // Save a new mail
        agent.post('/api/mails')
          .send(mail)
          .expect(200)
          .end(function (mailSaveErr, mailSaveRes) {
            // Handle mail save error
            if (mailSaveErr) {
              return done(mailSaveErr);
            }

            // Delete an existing mail
            agent.delete('/api/mails/' + mailSaveRes.body._id)
              .send(mail)
              .expect(200)
              .end(function (mailDeleteErr, mailDeleteRes) {
                // Handle mail error error
                if (mailDeleteErr) {
                  return done(mailDeleteErr);
                }

                // Set assertions
                (mailDeleteRes.body._id).should.equal(mailSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an mail if not signed in', function (done) {
    // Set mail user
    mail.sender = user;

    // Create new mail model instance
    var mailObj = new Mail(mail);

    // Save the mail
    mailObj.save(function () {
      // Try deleting mail
      request(app).delete('/api/mails/' + mailObj._id)
        .expect(403)
        .end(function (mailDeleteErr, mailDeleteRes) {
          // Set message assertion
          (mailDeleteRes.body.message).should.match('User is not authorized');

          // Handle mail error error
          done(mailDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Mail.remove().exec(done);
    });
  });
});
