'use strict';

/**
 * Tags global service to translate tag integer value into translated text.
 * 
 * To use this global service, make sure to include TagsService in your controller.
 * 
 * To convert an array of input integers into a corresponding output array containing the translated
 * descriptions for the tags, use the following code in your controller:
 * 
 * @code 
  angular.module('offerings').controller('EditProfileController', ['$scope', '$rootScope', '$http', '$location', 'UserService', 'TagsService', 
  function ($scope, $rootScope, $http, $location, UserService, TagsService) {

    TagsService.getAllNames(function(arrayOfAllTagsWithNames) {
      // Returns array like:  [ { tagID: 1, tagName: 'Job Training' }, {tagID: 2, tagName: 'Language Courses' }, ... ]
      $scope.allTags = arrayOfAllTagsWithNames;
    });

    TagsService.convertNamesToIDs($scope.allTags, function(arrayOfTagIDs) {
      // Returns array like: [ 1, 2, 3, 4, 5, 100, 101, 102, 103, 104, 105, 106 ]
      $scope.allIDs = arrayOfTagIDs;
    });

    TagsService.convertIDsToNames($scope.allTags, function(arrayOfTagsWithNames) {
      // Returns array like:  [ { tagID: 1, tagName: 'Job Training' }, {tagID: 2, tagName: 'Language Courses' }, ... ]
      $scope.selectedTags = arrayOfTagsWithNames;
    });

  }];
 * @endcode
 * 
 * The APIs currently offered are:
 * 
 * getAllNames(callback(arrayOfAllTagsWithNames));
 * convertNamesToIDs(arrayOfTagNames, callback(arrayOfTagIDs));
 * convertIDsToNames(arrayOfTagIDs, callback(arrayOfTagNames));
 * 
 **/
angular.module('tags').service('TagsService', [ '$http', '$filter', 'LanguageService', function ($http, $filter, LanguageService) {

  // Cache items to avoid having to re-generate repeatedly
  this.cachedLanguage = '';
  this.cachedAllNames = [];

  // TODO: Convert this list into properties for 'tags' view....
  //var tagList = ['Job Training', 'Language Courses', 'Medical Assistance', 'Childcare', 'Others', 'Food Preparation', 
  //               'Customer Service', 'Hair Cutting', 'Plumbing', 'Mechanics', 'General Labour', 'Construction'];

  this.generateAllNames = function(callback) {
    var self = this;
    var allProperties = LanguageService.getPropertiesByViewName('tags', $http, function(translationList) {
      self.cachedAllNames = [];
//      Object.keys(translationList).forEach(function(category) {
//        if (cat[category] === true) {
//          myArray.push(category);
//          anyFound = true;
//        }
//      });
      // Can we just store these in the properties file in an efficient format/array?
      // Maybe just store as array of strings, index of array becomes tagID?
//      {
//        viewName: 'tags',
//        tagList: ['string1', 'string2', 'string3']
//      }
      // Need to go through translationList, and for each 'number':
      // - make JSON { tagID: <number>, tagNameName: translationList.<number> }
      // - push JSON onto cachedAllNames
    });
  };

  this.getAllNames = function(callback) {
    var self = this;
    var newLanguage = LanguageService.getCurrentLanguage();
    if ((newLanguage === self.cachedLanguage) && (self.cachedAllNames.length > 0)) {
      callback(self.cachedAllNames);
    } else {
      self.generateAllNames(function() {
        callback(self.cachedAllNames);
      });
    }
  };

  this.convertNamesToIDs = function(tagNames, callback) {
    var allIDs = [];
    tagNames.forEach(function(tag) {
      allIDs.push(tag.tagID);
    });
    callback(allIDs);
  };

  this.doConvertIDsToNames = function(arrayOfTagIDs, callback) {
    var nameArray = [];
    var nextNameArray;
    arrayOfTagIDs.forEach(function(tagID) {
      nextNameArray = $filter('filter')(this.cachedAllNames, function (test) { return test.tagID === tagID; });
      if (nextNameArray.length === 1) {
        nameArray.push(nextNameArray[0]);
      } else if (nextNameArray.length === 0) {
        console.log('Tags: ERROR: Unable to find tag for ID ' + tagID);
      } else {
        console.log('Tags: ERROR: Only expected to find a single match for tag ID ' + tagID + ', found: ' + JSON.stringify(nextNameArray));
      }
    });
    callback(nameArray);
  };

  this.convertIDsToNames = function(arrayOfTagIDs, callback) {
    var self = this;
    var newLanguage = LanguageService.getCurrentLanguage();
    if ((newLanguage === self.cachedLanguage) && (self.cachedAllNames.length > 0)) {
      self.doConvertIDsToNames(arrayOfTagIDs, callback);
    } else {
      self.generateAllNames(function() {
        self.doConvertIDsToNames(arrayOfTagIDs, callback);
      });
    }
  };

}
]);

