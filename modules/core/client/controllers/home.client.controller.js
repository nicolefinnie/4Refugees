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
