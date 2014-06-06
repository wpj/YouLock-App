angular.module('controllers', [])

.controller('MapCtrl', ['$scope', '$ionicLoading', '$cordovaGeolocation', 'Lockup', function($scope, $ionicLoading, $cordovaGeolocation, Lockup){
  $scope.map = {
    control: {},
    center: {
      latitude: 40.677380, 
      longitude: -73.976949
    },
    zoom: 13,
    options: {
      disableDefaultUI: true
    },
    events: {
      dragend: function(map, event, eventArgs) {
        console.log('Done dragging');
      },
      zoom_changed: function(map, event, eventArgs) {
        console.log('Zoom changed');
      }
      // tilesloaded: function (map, eventName, originalEventArgs) {},
      // click: function(map, eventName, originalEventArgs){},
      // bounds_changed: function(map, eventName, originalEventArgs) {}
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
  };

  $scope.searchInMapBounds = function() {
    $ionicLoading.show({
      content: '<i class="icon ion-loading-c"></i>',
      noBackdrop: true,
      showBackdrop: false
    });
  };

  var boundsChanged = function() {
    var currentMap = $scope.map.control.getGMap().getBounds();
    console.log(currentMap);
  };

  $scope.removeLockups = function() {
    $scope.lockups = [];
  };

  $scope.refreshMap = function() {
    $scope.map.control.refresh({latitude: 32.779680, longitude: -79.935493});
    console.log($scope.map.control.getGMap().getBounds())
  }

}])