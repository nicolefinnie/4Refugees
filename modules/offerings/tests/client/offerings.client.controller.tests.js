'use strict';

(function () {
  // Offerings Controller Spec
  describe('Offerings Controller Tests', function () {
    // Initialize global variables
    var OfferingsController,
      scope,
      $httpBackend,
      $stateParams,
      $location,
      Authentication,
      Offerings,
      Socket,
      mockOffering;

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
              // TODO: Match more values?
              var myPass = (actual.description === expected.description);
              return {
                pass: myPass
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
    beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _Authentication_, _Offerings_, _Socket_) {
      // Set a new global scope
      scope = $rootScope.$new();
      $rootScope.currentLanguage = 'en';

      // Point global variables to injected services
      $stateParams = _$stateParams_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      Authentication = _Authentication_;
      Offerings = _Offerings_;
      Socket = _Socket_;

      // create mock offering
      mockOffering = new Offerings({
        _id: '525a8422f6d0f87f0e407a33',
        description: 'A MEAN Offering',
        descriptionLanguage: 'en',
        offerType: 'offer',
        city: 'Stuttgart',
        loc: { type: 'Point', coordinates : [ Number(8.8), Number(9.9) ] },
        category: ['others']
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['user']
      };

      // Initialize the Offerings controller.
      OfferingsController = $controller('OfferingsController', {
        $scope: scope
      });

      // Make sure the Socket is connected
      if (!Socket.socket) {
        Socket.connect();
      }

      // Add an event listener to the 'offeringMessage' event and toast logged in users
      Socket.on('offeringMessage', function (message) {
        var toastContent = '<span>new dummy';
      });
    }));

    it('$scope.find() should create an array with at least one offering object fetched from XHR', inject(function (Offerings) {
      // Create a sample offerings array that includes the new offering
      var sampleOfferings = [mockOffering];

      // Set GET response
      $httpBackend.expectGET('api/offerings').respond(sampleOfferings);

      // Run controller functionality
      scope.find();
      $httpBackend.flush();

      // Test scope value
      expect(scope.offerings).toEqualData(sampleOfferings);
    }));

    it('$scope.findOne() should create an array with one offering object fetched from XHR using a offeringId URL parameter', inject(function (Offerings) {
      // Set the URL parameter
      $stateParams.offeringId = mockOffering._id;

      // Set GET response
      $httpBackend.expectGET(/api\/offerings\/([0-9a-fA-F]{24})$/).respond(mockOffering);

      // Run controller functionality
      scope.findOne();
      $httpBackend.flush();

      // Test scope value
      expect(scope.offering).toEqualData(mockOffering);
    }));

    describe('$scope.create()', function () {
      var sampleOfferingPostData;

      beforeEach(function () {
        // Create a sample offering object
        var sampleUserPostData = {
          firstName: 'Full',
          lastName: 'Name',
          displayName: 'Full Name',
          email: 'test@test.com',
          username: 'username',
          password: 'M3@n.jsI$Aw3$0m3'
        };
        sampleOfferingPostData = new Offerings({
          _id: '525a8422f6d0f87f0e407a33',
          description: 'A MEAN Offering',
          descriptionLanguage: 'en',
          city: 'Stuttgart',
          loc: { type: 'Point', coordinates : [ Number(8.8), Number(9.9) ] },
          user: sampleUserPostData,
          offerType: 'offer',
          category: ['others']
        });

        // Fixture mock form input values
        scope.description = 'A MEAN Offering';
        scope.city = 'Stuttgart';

        spyOn($location, 'path');
      });

      it('should send a POST request with the form input values and then locate to new object URL', inject(function (Offerings) {
        // Set POST response
        $httpBackend.expectPOST('api/offerings', sampleOfferingPostData).respond(mockOffering);

        // Run controller functionality
        scope.description = mockOffering.description;
        scope.city = mockOffering.city;
        scope.longitude = mockOffering.loc.coordinates[0];
        scope.latitude = mockOffering.loc.coordinates[1];
        scope.create(true);
        $httpBackend.flush();

        // Test form inputs are reset
        expect(scope.description).toEqual('');
        expect(scope.city).toEqual('');

        // Test URL redirection after the offering was created
        expect($location.path.calls.mostRecent().args[0]).toBe('offerings/' + mockOffering._id);
      }));

      it('should set scope.error if save error', function () {
        var errorMessage = 'this is an error message';
        $httpBackend.expectPOST('api/offerings', sampleOfferingPostData).respond(400, {
          message: errorMessage
        });

        scope.longitude = mockOffering.loc.coordinates[0];
        scope.latitude = mockOffering.loc.coordinates[1];
        scope.create(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      });
    });

    describe('$scope.update()', function () {
      beforeEach(function () {
        // Mock offering in scope
        scope.offering = mockOffering;
      });

      it('should update a valid offering', inject(function (Offerings) {
        // Set PUT response
        $httpBackend.expectPUT(/api\/offerings\/([0-9a-fA-F]{24})$/).respond();

        // Run controller functionality
        scope.update(true);
        $httpBackend.flush();

        // Test URL location to new object
        expect($location.path()).toBe('/offerings/' + mockOffering._id);
      }));

      it('should set scope.error to error response message', inject(function (Offerings) {
        var errorMessage = 'error';
        $httpBackend.expectPUT(/api\/offerings\/([0-9a-fA-F]{24})$/).respond(400, {
          message: errorMessage
        });

        scope.update(true);
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      }));
    });

    describe('$scope.remove(offering)', function () {
      beforeEach(function () {
        // Create new offerings array and include the offering
        scope.offerings = [mockOffering, {}];

        // Set expected DELETE response
        $httpBackend.expectDELETE(/api\/offerings\/([0-9a-fA-F]{24})$/).respond(204);

        // Run controller functionality
        scope.remove(mockOffering);
      });

      it('should send a DELETE request with a valid offeringId and remove the offering from the scope', inject(function (Offerings) {
        expect(scope.offerings.length).toBe(1);
      }));
    });

    describe('scope.remove()', function () {
      beforeEach(function () {
        spyOn($location, 'path');
        scope.offering = mockOffering;

        $httpBackend.expectDELETE(/api\/offerings\/([0-9a-fA-F]{24})$/).respond(204);

        scope.remove();
        $httpBackend.flush();
      });

      it('should redirect to offerings', function () {
        expect($location.path).toHaveBeenCalledWith('offerings');
      });
    });
  });
}());
