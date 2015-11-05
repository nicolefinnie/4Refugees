'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication',
  function ($scope, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
  }
]);

angular.module('core').controller('HomeController', ['$scope', 
   function($scope) {

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

  $scope.addSlide = function(index1,index2) {
    var index = index1;
    var newWidth = 600 + slides.length + 1;
    var imgName = 'modules/core/client/img/startpage/img';
    if (index2 !== 0) {
      imgName = 'modules/core/client/img/startpage/imh';
      index = index2;
    }

    slides.push({
      image: imgName + index + '.jpg',
      text: ['Refugees', 'Refugees', 'Future citizens'][slides.length % 3]
    });
  };
  for (var i=0; i<9; i++) {
    $scope.addSlide(i+1,0);
  }
  for (i=0; i<2; i++) {
    $scope.addSlide(i+1,i+1);
  }
});

