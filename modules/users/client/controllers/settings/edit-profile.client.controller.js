'use strict';
angular.module('users').config(function(tagsInputConfigProvider) {
  tagsInputConfigProvider.setDefaults('tagsInput', { placeholder: '' });
  tagsInputConfigProvider.setActiveInterpolation('tagsInput', { placeholder: true });
});

angular.module('users').controller('EditProfileController', ['$scope', '$rootScope', '$http', '$location', 'UserService', 
  function ($scope, $rootScope, $http, $location, UserService) {
    
    // make a deep copy of the original object, so the values can be reverted when the cancel button is hit
    var userCopy = angular.copy($scope.user);
    $scope.isEditMode = true;
    $scope.editNameDetails = function(){
      $scope.isEditMode = true;
    };
    
    // activeProfile is used for the profile html view - for better HTML code re-use 
    // so we point the logged-in user object to activeProfile, rather than use logged-in user object directly in HTML
    // because some other modules that include HTML view have the logged-in user itself as well as profiles of other users
    // it would mistakenly show the logged-in user profile rather than other profiles.
    $scope.activeProfile = $scope.user;
    
    // Update a user profile
    $scope.updateUserProfile = function (isValid, userForm) {   
      $scope.success = $scope.error = null;
    
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', userForm);
        return false;
      }
       
      UserService.updateUserProfile ($scope.user, function(errorResponse, userProfile) {
        if(errorResponse){
          $scope.error = errorResponse.data.message;
        } else {
          $scope.$broadcast('show-errors-reset', userForm);
          $scope.success = true;

          $scope.user = userProfile;
          $scope.activeProfile = $scope.user;
          // after updating we should update the copy by replacing it with the current user object saved in the database
          userCopy = $.extend(true, {}, $scope.user);
          var $toastContent = $('<span>'+$scope.properties.profileSavedSuccessfully+'</span>');
          Materialize.toast($toastContent, 4000);
          
        }
      });
    };

    $scope.cancelUserProfile = function (userForm) {
      if (userForm === 'userNameForm') {
        $scope.user.firstName = userCopy.firstName;
        $scope.user.lastName = userCopy.lastName;
      } else if (userForm === 'userAboutMeForm') {
        $scope.user.aboutMe = userCopy.aboutMe;
      } else if (userForm === 'userLanguageForm') {
        $scope.user.tagsLanguages = angular.copy(userCopy.tagsLanguages);
      } else if (userForm === 'userSkillForm') {
        $scope.user.tagsSkills = angular.copy(userCopy.tagsSkills);
      } else if (userForm === 'userInterestForm') {
        $scope.user.tagsInterests = angular.copy(userCopy.tagsInterests);
      } else if (userForm === 'userSocialProfileForm') {
        $scope.user.publicLinkedInProfile = userCopy.publicLinkedInProfile;
      }      
    };
    
    // Tags for skills and interests
    $scope.loadTags = function($query) {
      var tags = [
                  { tagID: '1', tagName: 'Job Training' },
                  { tagID: '2', tagName: 'Language Courses' },
                  { tagID: '3', tagName: 'Medical Assistance' },
                  { tagID: '4', tagName: 'Childcare' },
                  { tagID: '5', tagName: 'Others' },
                  { tagID: '6', tagName: 'Food Preparation' },
                  { tagID: '7', tagName: 'Customer Service' },
                  { tagID: '8', tagName: 'Hair Cutting' },
                  { tagID: '9', tagName: 'Plumbing' },
                  { tagID: '10', tagName: 'Mechanics' },
                  { tagID: '11', tagName: 'General Labour' },
                  { tagID: '12', tagName: 'Construction' }
      ];
      return tags.filter(function(tag) {
        return tag.tagName.toLowerCase().indexOf($query.toLowerCase()) !== -1;
      });
    };

    // Tags for the languages
    $scope.loadLanguageTags = function($query) {
      var languageTags = [
                      { tagID: 'en', tagName: 'English' },
                      { tagID: 'de', tagName: 'Deutsch' },
                      { tagID: 'ar', tagName: 'العربية' },
                      { tagID: 'fa', tagName: 'فارسی' },
                      { tagID: 'fr', tagName: 'Français' },
                      { tagID: 'es', tagName: 'Español' },
                      { tagID: 'it', tagName: 'Italiano' }
      ];
      return languageTags.filter(function(tag) {
        return tag.tagName.toLowerCase().indexOf($query.toLowerCase()) !== -1;
      });
    };

  }
]);
