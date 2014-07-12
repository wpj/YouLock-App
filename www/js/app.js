angular.module('lockupFront', ['ionic', 'google-maps', 'controllers', 'directives', 'services', 'ngCordova', 'ngAutocomplete'])

.config(function($httpProvider, $sceDelegateProvider) {
    
    $httpProvider.responseInterceptors.push(function($q) {
      return function(promise) {
        return promise.then(
          // Success: just return the response
          function(response){
            return response;
          },
          // Error: check the error status to get only the 401
          function(response) {
            if (response.status === 401) console.log(response);
            return $q.reject(response);
          }
        );
      };
    });
    
    // $httpProvider.defaults.withCredentials = true;

    // $httpProvider.defaults.transformResponse;
    // $httpProvider.defaults.useXDomain = true;
    // delete $httpProvider.defaults.headers.common['X-Requested-With'];

    // $sceDelegateProvider.resourceUrlWhitelist(['self', 'http://localhost:8080/**']);
  })

.run(['$ionicPlatform', function($ionicPlatform){
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
}]);

angular.element(document).ready(function() {
  document.addEventListener('deviceready', function() {
    angular.bootstrap(document, ['lockupFront']);
  });
});