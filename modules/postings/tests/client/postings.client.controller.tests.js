'use strict';

(function () {
  // Postings Controller Spec
  describe('Postings Controller Tests', function () {
    // Initialize global variables
    var PostingsController,
      NewPostingsController,
      PostingsCreateController,
      scope,
      $httpBackend,
      $stateParams,
      $location,
      Authentication,
      Postings,
      mockPosting;

    // The $resource service augments the response object with methods for updating and deleting the resource.
    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
    // When the toEqualData matcher compares two objects, it takes only object properties into
    // account and ignores methods.
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Then we can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _Authentication_, _Postings_) {
      // Set a new global scope
      scope = $rootScope.$new();

      // Point global variables to injected services
      $stateParams = _$stateParams_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      Authentication = _Authentication_;
      Postings = _Postings_;

      var sampleUserPostData = {
        _id: '525a8422f6d0f87f0e407a33',
        firstName: 'Full',
        lastName: 'Name',
        displayName: 'Full Name',
        email: 'test@test.com',
        username: 'username',
        password: 'M3@n.jsI$Aw3$0m3'
      };

      // create mock posting
      mockPosting = new Postings({
        _id: '525a8422f6d0f87f0e407a33',
        title: 'A Posting about MEAN',
        content: 'MEAN rocks, definitively!',
        contentShort: 'MEAN rocks, definitively!',
        recipient: sampleUserPostData._id,
        replyTo: '525a8422f6d0f87f0e407a33',
        offeringId: '525a8422f6d0f87f0e407a33',
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['user']
      };

      // Initialize the Postings controller.
      PostingsController = $controller('PostingsController', {
        $scope: scope
      });
      NewPostingsController = $controller('NewPostingsController', {
        $scope: scope
      });
      PostingsCreateController = $controller('PostingsCreateController', {
        $scope: scope
      });
    }));

    it('$scope.find() should create an array with at least one posting object fetched from XHR', inject(function (Postings) {
      // Create a sample postings array that includes the new posting
      var samplePostings = [mockPosting];

      // Set GET response
      $httpBackend.expectGET('api/postings?reset=true').respond(samplePostings);

      // Run controller functionality
      scope.find();
      $httpBackend.flush();

      // Test scope value
      expect(scope.postings).toEqualData(samplePostings);
    }));

    it('$scope.findOne() should create an array with one posting object fetched from XHR using a postingId URL parameter', inject(function (Postings) {
      // Set the URL parameter
      $stateParams.postingId = mockPosting._id;

      // Set GET response
      //$httpBackend.expectGET(/api\/postings\/([0-9a-fA-F]{24})$/).respond(mockPosting);
      $httpBackend.expectGET('api/postings').respond(mockPosting);

      // Run controller functionality
      scope.findOne();
      $httpBackend.flush();

      // Test scope value
      expect(scope.posting).toEqualData(mockPosting);
    }));

    describe('$scope.create()', function () {
      var samplePostingPostData, sampleUserPostData;

      beforeEach(function () {
        // Create a sample posting object

        sampleUserPostData = {
          _id: '525a8422f6d0f87f0e407a33',
          firstName: 'Full',
          lastName: 'Name',
          displayName: 'Full Name',
          email: 'test@test.com',
          username: 'username',
          password: 'M3@n.jsI$Aw3$0m3'
        };

        samplePostingPostData = new Postings({
          title: 'A Posting about MEAN',
          content: 'MEAN rocks, definitively!',
          replyTo: '525a8422f6d0f87f0e407a33',
          recipient: sampleUserPostData._id,
          offeringId: '525a8422f6d0f87f0e407a33',
        });
        //contentShort: 'MEAN rocks, definitively!',

        // Fixture mock form input values
        scope.title = 'A Posting about MEAN';
        scope.content = 'MEAN rocks, definitively!';
        scope.recipient = sampleUserPostData;
        scope.replyTo = '525a8422f6d0f87f0e407a33';
        scope.offeringId = '525a8422f6d0f87f0e407a33';

        spyOn($location, 'path');
      });

      it('should send a POST request with the form input values and then locate to new object URL', inject(function (Postings) {
        // Set POST response
        $httpBackend.expectPOST('api/postings', function(reqHandler) {
          var rh = JSON.parse(reqHandler);
          delete rh.unread;
          //if (!angular.equals(rh, samplePostingPostData)) {console.log('got: ' + JSON.stringify(rh) + ' | ' + JSON.stringify(samplePostingPostData));}
          return angular.equals(rh, samplePostingPostData);
        }).respond(mockPosting);

        // Run controller functionality - same as in list-postings.client.view.html,
        scope.recipient = [sampleUserPostData];
        scope.create(true);
        $httpBackend.flush();

        // Test form inputs are reset
        expect(scope.title).toEqual('');
        expect(scope.content).toEqual('');

        // URL redirection after the posting was created 
        expect($location.path.calls.mostRecent().args[0]).toBe('postings/' + mockPosting._id);
      }));

      it('should send a POST request with the form input values when opening up the reply modal', inject(function (Postings) {
        // Set POST response
        $httpBackend.expectPOST('api/postings', function(reqHandler) {
          var rh = JSON.parse(reqHandler);
          delete rh.unread;
          if (!angular.equals(rh, samplePostingPostData)) {console.log('got: ' + JSON.stringify(rh) + ' | ' + JSON.stringify(samplePostingPostData));}
          return angular.equals(rh, samplePostingPostData);
        }).respond(mockPosting);

        // Run controller functionality - same as in list-postings.client.view.html,
        scope.create(true, scope.recipient);
        $httpBackend.flush();

        // Test form inputs are reset
        expect(scope.title).toEqual('');
        expect(scope.content).toEqual('');

        // No URL redirection after the posting was created 
        expect(typeof $location.path.calls.mostRecent().args[0]).toBe('undefined');
      }));

      it('should set scope.error if save error', function () {
        var errorMessage = 'this is an error message';
        $httpBackend.expectPOST('api/postings', function(reqHandler) {
          var rh = JSON.parse(reqHandler);
          delete rh.unread;
          //if (!angular.equals(rh, samplePostingPostData)) {console.log('got: ' + JSON.stringify(rh) + ' | ' + JSON.stringify(samplePostingPostData));}
          return angular.equals(rh, samplePostingPostData);
        }).respond(400, {
          message: errorMessage
        });

        //scope.recipient = [sampleUserPostData];
        scope.create(true, sampleUserPostData);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      });
    });

    // Updating an email is currently obsolete
    describe('$scope.update()', function () {
      beforeEach(function () {
        // Mock posting in scope
        scope.posting = mockPosting;
      });

      it('should update a valid posting', inject(function (Postings) {
        // Set PUT response
        $httpBackend.expectPUT(/api\/postings\/([0-9a-fA-F]{24})$/).respond();

        // Run controller functionality
        scope.update(true);
        $httpBackend.flush();

        // Test URL location to new object
        expect($location.path()).toBe('/postings/' + mockPosting._id);
      }));

      it('should set scope.error to error response message', inject(function (Postings) {
        var errorMessage = 'error';
        $httpBackend.expectPUT(/api\/postings\/([0-9a-fA-F]{24})$/).respond(400, {
          message: errorMessage
        });

        scope.update(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      }));
    });

    describe('$scope.removePosting(posting)', function () {
      beforeEach(function () {
        // Create new postings array and include the posting
        scope.postings = [mockPosting, {}];

        // Set expected DELETE response
        $httpBackend.expectDELETE(/api\/postings\/([0-9a-fA-F]{24})$/).respond(204);

        // Run controller functionality
        scope.removePosting(mockPosting);
        $httpBackend.flush();
      });

      it('should send a DELETE request with a valid postingId and remove the posting from the scope', inject(function (Postings) {
        expect(scope.postings.length).toBe(1);
      }));
    });

    describe('scope.remove()', function () {
      beforeEach(function () {
        spyOn($location, 'path');
        scope.posting = mockPosting;

        $httpBackend.expectDELETE(/api\/postings\/([0-9a-fA-F]{24})$/).respond(204);

        scope.removePosting();
        $httpBackend.flush();
      });

      it('should redirect to postings', function () {
        expect($location.path).toHaveBeenCalledWith('postings');
      });
    });
  });
}());
