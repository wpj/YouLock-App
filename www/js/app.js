var app = angular.module('lockupFront', ['ionic', 'google-maps'])

app.controller('MainCtrl', function($scope) {
  $scope.map = {
    center: {
      latitude: 43.07493, 
      longitude: -89.381388
    },
    zoom: 8,
    options: {
      disableDefaultUI: true
    }
  };
});

app.run(function($ionicPlatform) {
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
})
