angular.module('controllers', [])

.controller('MapCtrl', function($scope, $ionicLoading, $cordovaGeolocation) {
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

  $scope.getPosition = function() {

    console.log("Centering");
    if (!$scope.map) {
      return;
    }

    $ionicLoading.show({
      content: 'Getting current location',
      showBackdrop: false
    });

    $cordovaGeolocation.getCurrentPosition().then(function(position) {
      console.log('Got position', position);
      $scope.map.center = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      $scope.map.zoom = 15;
      $ionicLoading.hide();
    }, function(err) {
      alert('Unable to get location: ' + error.message);
    });
  }

});