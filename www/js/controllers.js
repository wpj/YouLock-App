angular.module('controllers', [])

.controller('MapCtrl', ['$scope', '$ionicLoading', '$cordovaGeolocation', 'Lockup', function($scope, $ionicLoading, $cordovaGeolocation, Lockup, underscore){
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
        searchInMapBounds(map);
      },
      zoom_changed: function(map, event, eventArgs) {
        searchInMapBounds(map);
      }
      // tilesloaded: function (map, eventName, originalEventArgs) {
      //   searchInMapBounds(map);
      // }
      // click: function(map, eventName, originalEventArgs){},
      // bounds_changed: function(map, eventName, originalEventArgs) {}
    }
  };

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

  var searchInMapBounds = function(map) {

    var currentMapArea = getMapBounds(map);

    Lockup.query().$promise.then(
      function(data) {
        // filters out the lockups not in the current map bounds
        $scope.lockups = _.filter(data, function(lockup) {
          var coords = new google.maps.LatLng(lockup.coordinates.latitude, lockup.coordinates.longitude);
          return currentMapArea.contains(coords);
        });
        console.log($scope.lockups);
      },
      function(err) {
        console.log(error);
      });
  };

  var getMapBounds = function(map) {
    return map.getBounds();
  }

}])
