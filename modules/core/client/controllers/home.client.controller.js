'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication',
  function ($scope, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    
    // Hide or show main buttons findHelp/helpOthers or hidden sub-buttons
    $scope.toggleFindHelp = function() {
      $scope.mainCallToButtons = !$scope.mainCallToButtons;
      $scope.findHelpCallToButtons = !$scope.findHelpCallToButtons;
    };
    $scope.toggleHelpOthers = function() {
      $scope.mainCallToButtons = !$scope.mainCallToButtons;
      $scope.helpOthersCallToButtons = !$scope.helpOthersCallToButtons;
    };
  }
]);

angular.module('core').controller('CarouselControl', function ($scope) {
//$scope.myInterval = 5000;
//$scope.noWrapSlides = false;
  var slides = $scope.slides = [];
  
  $scope.addSlide = function(index) {
    var newWidth = 600 + slides.length + 1;
    slides.push({
      //image: '//placekitten.com/' + newWidth + '/300',
      image: 'modules/core/client/img/startpage/img' + index + '.jpg',
      text: ['Refugees', 'Refugees', 'Future citizens'][slides.length % 3]
    });
  };
  for (var i=0; i<8; i++) {
    $scope.addSlide(i+1);
  }
});

