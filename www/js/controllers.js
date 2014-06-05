angular.module('controllers', [])

.controller('MapCtrl', function($scope, $ionicLoading, $cordovaGeolocation) {
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

  $scope.lockups = [
    {
      id: 1,
      latitude: 40.674263,
      longitude: -73.981158
    },
    {
      id: 2,
      latitude: 40.678169,
      longitude: -73.966953
    },
    {
      id: 3,
      latitude: 40.687525,
      longitude: -73.964636
    },
    {
      id: 4,
      latitude: 40.669250,
      longitude: -73.960731
    },
    {
      id: 5,
      latitude: 40.658100,
      longitude: -73.978627
    },
  ]

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

});