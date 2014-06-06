angular.module('controllers', [])

.controller('MapCtrl', ['$scope', '$ionicLoading', '$cordovaGeolocation', 'Lockup', function($scope, $ionicLoading, $cordovaGeolocation, Lockup){
  $scope.map = {
    center: {
      latitude: 40.677380, 
      longitude: -73.976949
    },
    zoom: 13,
    options: {
      disableDefaultUI: true
    }
  };

  $scope.lockups = Lockup.query();

  $scope.getPosition = function() {

    console.log("Centering");
    if (!$scope.map) {
      return;
    }

    $ionicLoading.show({
      content: '<i class="icon ion-loading-c"></i>',
      noBackdrop: true,
      showBackdrop: false
    });

    $cordovaGeolocation.getCurrentPosition().then(function(position) {
      console.log('Got position', position);
      $scope.map.center = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      $scope.map.zoom = 15;
      $ionicLoading.hide();
      return position.coords;
    }, function(err) {
      alert('Unable to get location: ' + error.message);
    });
  }
}])