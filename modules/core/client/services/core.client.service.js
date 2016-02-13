'use strict';
/* thanks to http://stackoverflow.com/questions/16349578/angular-directive-for-a-fallback-image?answertab=votes#tab-top 
 * when an image doesn't exist, it falls back to the image defined as data-fallback-src directive in html */
angular.module('core').directive('fallbackSrc', function () {
  var fallbackSrc = {
    link: function postLink(scope, iElement, iAttrs) {
      iElement.bind('error', function() {
        angular.element(this).attr('src', iAttrs.fallbackSrc);
      });
    }
  };
  return fallbackSrc;
});

angular.module('core').directive('ngReallyClick', [function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.bind('click', function() {
        var message = attrs.ngReallyMessage;
        if (message && confirm(message)) {
          scope.$apply(attrs.ngReallyClick);
        }
      });
    }
  };
}]);