'use strict';
angular.module('users').config(function(tagsInputConfigProvider) {
  tagsInputConfigProvider.setDefaults('tagsInput', { placeholder: '' });
  tagsInputConfigProvider.setActiveInterpolation('tagsInput', { placeholder: true });
});

angular.module('users').controller('EditProfileController', ['$scope', '$rootScope', '$http', '$location', 'UserService', 
  function ($scope, $rootScope, $http, $location, UserService) {
    
    // make a deep copy of the original object, so the values can be reverted when the cancel button is hit
    var userCopy = angular.copy($scope.user);
    $scope.isInProfileEditMode = true;
    $scope.isEditPicture = false;
    $scope.isEditName = false;
    $scope.isEditAboutMe = false;
    $scope.isEditLanguage = false;
    $scope.isEditSkill = false;
    $scope.isEditInterest = false;
    $scope.isEditSocialProfile = false;
    
    $scope.toggleProfileSection = function(attribute){
      if (attribute === 'picture'){
        $scope.isEditPicture = !$scope.isEditPicture;
      } else if (attribute === 'name') {
        $scope.isEditName = !$scope.isEditName;
      } else if (attribute === 'aboutMe') {
        $scope.isEditAboutMe = !$scope.isEditAboutMe;
      } else if (attribute === 'language') {
        $scope.isEditLanguage = !$scope.isEditLanguage;
      } else if (attribute === 'skill') {
        $scope.isEditSkill = !$scope.isEditSkill;
      } else if (attribute === 'interest') {
        $scope.isEditInterest = !$scope.isEditInterest;
      } else if (attribute === 'socialProfile') {
        $scope.isEditSocialProfile = !$scope.isEditSocialProfile;
      } 
    };
    $scope.toggleAdvancedSetting = function(){
      $scope.showAdvancedSetting = !$scope.showAdvancedSetting;
    };
    
    $scope.toggleLoginSection = function(){
      $scope.showLoginSection = !$scope.showLoginSection;
    };
    
    $scope.togglePasswordSection = function(){
      $scope.showPasswordSection = !$scope.showPasswordSection;
    };
    
    $scope.toggleSocialProfileSection = function(){
      $scope.showSocialProfileSection = !$scope.showSocialProfileSection;
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
      } else if (userForm === 'userLoginForm') {
        $scope.user.username = userCopy.username;
        $scope.user.email = userCopy.email;
      }     
    };
    
    // Tags for skills and interests
    $scope.loadTags = function($query) {
      var tagList = ['Job Training', 'Language Courses', 'Medical Assistance', 'Childcare', 'Others', 'Food Preparation', 
                     'Customer Service', 'Hair Cutting', 'Plumbing', 'Mechanics', 'General Labour', 'Construction'];
      
      var tags = [];
      for(var i = 0; i < tagList.length; i++){
        var newTag = {
          tagID: i+1,
          tagName: tagList[i]
        };                                                                     
        tags.push(newTag);
      }
    
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
