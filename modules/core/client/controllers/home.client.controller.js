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


// NF: Keep it simple and readable, no more hacks
angular.module('core').controller('CarouselControl', function ($scope) {
  var slides = $scope.slides = [];

  $scope.addSlide = function(index) {
    var newWidth = 600 + slides.length + 1;
   
    slides.push({
      image: 'modules/core/client/img/startpage/img' + index + '.jpg'
      //,text: ['Refugees', 'Refugees', 'Future citizens'][slides.length % 3]
    });
  };
 
  for (var i=0; i<3; i++) {
    $scope.addSlide(i);
  }
});

