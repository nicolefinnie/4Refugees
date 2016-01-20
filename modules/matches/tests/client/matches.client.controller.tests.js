'use strict';

//(function () {
//  // Matches Controller Spec
//  describe('Matches Controller Tests', function () {
//    // Initialize global variables
//    var MatchesController,
//      scope,
//      $httpBackend,
//      $stateParams,
//      $location,
//      Authentication,
//      Matches,
//      Socket,
//      GeoSelector,
//      LanguageService,
//      mockMatch;
//
//    // The $resource service augments the response object with methods for updating and deleting the resource.
//    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
//    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
//    // When the toEqualData matcher compares two objects, it takes only object properties into
//    // account and ignores methods.
//    beforeEach(function () {
//      jasmine.addMatchers({
//        toEqualData: function (util, customEqualityTesters) {
//          return {
//            compare: function (actual, expected) {
//              // TODO: Match more values?
//              var myPass = (actual.description === expected.description);
//              console.log('EQUAL ? ' + myPass + '  ' + actual.description + ' = ' + expected.description);
//              return {
//                pass: myPass
//              };
//            }
//          };
//        }
//      });
//    });
//
//    // Then we can start by loading the main application module
//    beforeEach(module(ApplicationConfiguration.applicationModuleName));
//
//    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
//    // This allows us to inject a service but then attach it to a variable
//    // with the same name as the service.
//    beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _Authentication_, _Matches_, _Socket_, _GeoSelector_, _LanguageService_) {
//      // Set a new global scope
//      scope = $rootScope.$new();
//      $rootScope.currentLanguage = 'en';
//
//      // Point global variables to injected services
//      $stateParams = _$stateParams_;
//      $httpBackend = _$httpBackend_;
//      $location = _$location_;
//      Authentication = _Authentication_;
//      Matches = _Matches_;
//      Socket = _Socket_;
//      GeoSelector = _GeoSelector_;
//      LanguageService = _LanguageService_;
//
//      // Setup the mock GeoService and LanguageService environment.
//      scope.geo = GeoSelector.setupTestEnvironment();
//      LanguageService.setupTestEnvironment();
//
//      // create mock match
//      mockMatch = new Matches({
//        _id: '525a8422f6d0f87f0e407a33',
//        description: 'A MEAN Match',
//        descriptionLanguage: 'en',
//        offerType: 'offer',
//        city: 'Stuttgart',
//        loc: { type: 'Point', coordinates : [ Number(8.8), Number(9.9) ] },
//        category: ['others']
//      });
//
//      // Mock logged in user
//      Authentication.user = {
//        roles: ['user']
//      };
//
//      // Initialize the Matches controller.
//      MatchesController = $controller('MatchesController', {
//        $scope: scope,
//      });
//
//    }));
//
//    it('$scope.find() should create an array with at least one match object fetched from XHR', inject(function (Matches) {
//      // Create a sample matches array that includes the new match
//      var sampleMatches = [mockMatch];
//
//      // Set GET response
//      $httpBackend.expectGET('api/matches').respond(sampleMatches);
//
//      // Setup dummy view properties needed by the controller, normally
//      // setup by loading all language-specific properties using LanguageService.
//      // The mockMatch used above is in the category 'others', so we need to
//      // provide a translation from the server-side 'others' to the client-side
//      // 'language-specific' display.
//      var properties = { 'others': 'Other' };
//      scope.properties = properties;
//
//      // Run controller functionality
//      scope.findAllMine();
//      $httpBackend.flush();
//
//      // Test scope value
//      expect(scope.matches).toEqualData(sampleMatches);
//    }));
//
//    it('$scope.findOne() should create an array with one match object fetched from XHR using a matchId URL parameter', inject(function (Matches) {
//      // Set the URL parameter
//      $stateParams.matchId = mockMatch._id;
//
//      // Set GET response
//      $httpBackend.expectGET(/api\/matches\/([0-9a-fA-F]{24})$/).respond(mockMatch);
//
//      // Run controller functionality
//      scope.findOne();
//      $httpBackend.flush();
//
//      // Test scope value
//      expect(scope.match).toEqualData(mockMatch);
//    }));
//
//    describe('$scope.create()', function () {
//      var sampleMatchPostData;
//
//      beforeEach(function () {
//        // Create a sample match object
//        var sampleUserPostData = {
//          firstName: 'Full',
//          lastName: 'Name',
//          displayName: 'Full Name',
//          email: 'test@test.com',
//          username: 'username',
//          password: 'M3@n.jsI$Aw3$0m3'
//        };
//        sampleMatchPostData = new Matches({
//          //_id: '525a8422f6d0f87f0e407a33',
//          description: 'A MEAN Match',
//          descriptionLanguage: 'en',
//          city: 'Stuttgart',
//          //loc: { type: 'Point', coordinates : [ Number(8.8), Number(9.9) ] },
//          longitude: Number(8.8),
//          latitude: Number(9.9),
//          //user: sampleUserPostData,
//          offerType: 'offer',
//          category: ['courses']
//        });
//
//        // Fixture mock form input values
//        scope.geo = GeoSelector.getInitialState({ 'enableLocator': false, 'enableList': false, 'enableManual': true });
//
//        var city = { 'city':mockMatch.city, 'lat':mockMatch.loc.coordinates[1], 'lng':mockMatch.loc.coordinates[0] };
//        GeoSelector.activateManual(scope.geo, city);
//        
//        scope.description = 'A MEAN Match';
//        scope.category = {}; // add category
//        scope.category.courses = true;
//        scope.offerType = 'offer';
//
//        spyOn($location, 'path');
//      });
//
//      it('should send a POST request with the form input values and then locate to new object URL', inject(function (Matches) {
//        // Set POST response
//        //$httpBackend.expectPOST('api/matches', sampleMatchPostData).respond(mockMatch);
//        $httpBackend.expectPOST('api/matches', function(reqHandler) {
//          var rh = JSON.parse(reqHandler);
//          delete rh.whenString;
//          delete rh.expiryString;
//          return angular.equals(rh, sampleMatchPostData);
//        }).respond(mockMatch);
//
//        // enable socket io listener to mock receive 'matchMessage' - otherwise located in header
//        Socket.on('matchMessage', function (message) {
//          var toastContent = message.content.category;
//          console.log('new stuff ' + toastContent);
//        });
//
//        // Run controller functionality
//        scope.description = mockMatch.description;
//        // Fake controller initialization needed to create matches
//        scope.matchId = '0';
//        $stateParams.matchId = '0';
//        scope.findOne();
//
//        scope.createOrUpdate();
//        $httpBackend.flush();
//
//        // Test form inputs are reset
//        expect(scope.description).toEqual(undefined);
//        expect(scope.city).toEqual(undefined);
//
//        // Test URL redirection after the match was created
//        expect($location.path.calls.mostRecent().args[0]).toBe('matches');
//      }));
//
//      it('should set scope.error if save error', function () {
//        // enable socket io listener to mock receive 'matchMessage' - otherwise located in header
//        Socket.on('matchMessage', function (message) {
//          var toastContent = message.content.category;
//          console.log('new stuff ' + toastContent);
//        });
//
//        var errorMessage = 'this is an error message';
//        $httpBackend.expectPOST('api/matches', function(reqHandler) {
//          var rh = JSON.parse(reqHandler);
//          delete rh.whenString;
//          delete rh.expiryString;
//          return angular.equals(rh, sampleMatchPostData);
//        }).respond(400, {
//          message: errorMessage
//        });
//
//        // invalid create without a description
//        var city = { 'name':mockMatch.city, 'lat':mockMatch.loc.coordinates[1], 'lng':mockMatch.loc.coordinates[0] };
//        scope.where = city;
//        // Fake controller initialization needed to create matches
//        scope.matchId = '0';
//        $stateParams.matchId = '0';
//        scope.findOne();
//      
//        scope.createOrUpdate();
//        $httpBackend.flush();
//
//        expect(scope.error).toBe(errorMessage);
//      });
//    });

//    describe('$scope.update()', function () {
//      beforeEach(function () {
//        // Mock match in scope
//        scope.match = mockMatch;
//      });
//
//      it('should update a valid match', inject(function (Matches) {
//        // enable socket io listener to mock receive 'matchMessage' - otherwise located in header
//        Socket.on('matchMessage', function (message) {
//          var toastContent = message.content.category;
//          console.log('new stuff ' + toastContent);
//        });
//
//        // test update an offer with the new city JSON
//        var city = { 'name':mockMatch.city, 'lat':mockMatch.loc.coordinates[1], 'lng':mockMatch.loc.coordinates[0] };
//        scope.where = city;
//
//        // Set PUT response
//        $httpBackend.expectPUT(/api\/matches\/([0-9a-fA-F]{24})$/).respond();
//
//        // Run controller functionality
//        scope.update(true);
//        $httpBackend.flush();
//
//        // Test URL location to new object
//        expect($location.path()).toBe('/matches');
//      }));
//
//      it('should set scope.error to error response message', inject(function (Matches) {
//        // enable socket io listener to mock receive 'matchMessage' - otherwise located in header
//        Socket.on('matchMessage', function (message) {
//          var toastContent = message.content.category;
//          console.log('new stuff ' + toastContent);
//        });
//
//        // test updating a city JSON without name
//        var city = { 'lat':mockMatch.loc.coordinates[1], 'lng':mockMatch.loc.coordinates[0] };
//        scope.where = city;
//
//        var errorMessage = 'error';
//        $httpBackend.expectPUT(/api\/matches\/([0-9a-fA-F]{24})$/).respond(400, {
//          message: errorMessage
//        });
//
//        scope.update(true);
//        $httpBackend.flush();
//
//        expect(scope.error).toBe(errorMessage);
//      }));
//    });

//    describe('$scope.removeMatchFromList(match)', function () {
//      beforeEach(function () {
//        // Create new matches array and include the match
//        scope.matches = [mockMatch, {}];
//
//        // Set expected DELETE response
//        $httpBackend.expectDELETE(/api\/matches\/([0-9a-fA-F]{24})$/).respond(204);
//
//        // Run controller functionality
//        scope.removeMatchFromList(mockMatch);
//      });
//
//      it('should send a DELETE request with a valid matchId and remove the match from the scope', inject(function (Matches) {
//        expect(scope.matches.length).toBe(1);
//      }));
//    });

//    describe('scope.removeSingleMatch(match)', function () {
//      beforeEach(function () {
//        spyOn($location, 'path');
//        scope.match = mockMatch;
//
//        $httpBackend.expectDELETE(/api\/matches\/([0-9a-fA-F]{24})$/).respond(204);
//
//        scope.removeSingleMatch(mockMatch);
//        $httpBackend.flush();
//      });
//
//      it('should redirect to matches', function () {
//        expect($location.path).toHaveBeenCalledWith('matches');
//      });
//    });
//  });
//}());
