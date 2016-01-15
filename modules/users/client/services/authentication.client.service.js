'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window',
  function ($window) {
    var auth = {
      user: $window.user
    };

    return auth;
  }
]);

//Directive to enable hiding/showing of advanced options in forms
angular.module('users').directive('mySlide', [
  function() {
    return {
      // Attribute-only, example <div data-my-slide="variable"> </div>
      restrict: 'A',

      // This is the function that gets executed after Angular has compiled the html
      link: function(scope, element, attrs) {
        // We do not want to abuse watch but here it is critical to determine
        // if the parameter has changed.
        scope.$watch(attrs.mySlide, function(newValue, oldValue) {
          // If the value is enabled, slide down to show the advanced options.
          // Otherwise, slide up to hide them.
          if (newValue) {
            return element.slideDown();
          } else {
            return element.slideUp();
          }
        });
      }
    };
  }
]);
