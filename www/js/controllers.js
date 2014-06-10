angular.module('controllers', [])

.controller('MapCtrl', ['$scope', '$ionicLoading', '$cordovaGeolocation', 'Lockup', function($scope, $ionicLoading, $cordovaGeolocation, Lockup, underscore){
  $scope.map = {
    control: {},
    center: {
      latitude: 50.677380, 
      longitude: -73.976949
    },
    zoom: 16,
    options: {
      disableDefaultUI: true
    },
    idKey: '_id',
    events: {
      idle: function(map, event, eventArgs) {
        console.log('Idle event triggered');
        searchInMapBounds(map);
      }
      // dragend: function(map, event, eventArgs) {
      //   console.log('Done dragging');
      //   searchInMapBounds(map);
      // },
      // zoom_changed: function(map, event, eventArgs) {
      //   searchInMapBounds(map);
      // }
      // tilesloaded: function (map, eventName, originalEventArgs) {
      //   searchInMapBounds(map);
      // }
      // click: function(map, eventName, originalEventArgs){},
      // bounds_changed: function(map, eventName, originalEventArgs) {}
    }
  };

  var getPosition = function() {
    $cordovaGeolocation.getCurrentPosition().then(function(position) {
      mapCenter = {latitude: position.coords.latitude, longitude: position.coords.longitude};
    });
  };

  var mapCenter = angular.element(document).ready(function() {
    $cordovaGeolocation.getCurrentPosition().then(function(position) {
      // console.log(position);
      console.log({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    }, function(err) {
      console.log('Unable to get location: ', error.message);
    });
    // console.log(mapCenter);
  });

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
      $scope.map.zoom = 17;
      $ionicLoading.hide();
      return position.coords;
    }, function(err) {
      alert('Unable to get location: ' + error.message);
    });
  };

  var getAllLockups = function() {
    Lockup.findAll()
      .success(function(data) {
        $scope.lockups = data;
        console.log($scope.lockups);
      })
      .error(function(err, status) {
        console.log(error, status);
      });
  };

  var searchInMapBounds = function(map) {

    var currentMapArea = getMapBounds(map);

    var northEast = currentMapArea.getNorthEast();
    var southWest = currentMapArea.getSouthWest();
    
    var SWLng = southWest.lng();
    var SWLat = southWest.lat();
    var NELng = northEast.lng(); 
    var NELat = northEast.lat();

    Lockup.findInMapArea(SWLng, SWLat, NELng, NELat)
      .success(function(data) {
        // filters out the lockups not in the current map bounds
        $scope.lockups = _.filter(data, function(lockup) {
          var coords = new google.maps.LatLng(lockup.location.coordinates[1], lockup.location.coordinates[0]);
          return currentMapArea.contains(coords);
        });

        /* Logic for caching markers already on the map (doesn't work yet) */

        // if (!$scope.lockups) {
        //   $scope.lockups = data;
        // } else {
        //   var newData = _.filter(data, function(lockup) {
        //     var coords = new google.maps.LatLng(lockup.coordinates[1], lockup.coordinates[0]);
        //     return currentMapArea.contains(coords);
        //   });
        //   $scope.lockups.push(newData);
        // };


        console.log('$scope.lockups: ',$scope.lockups);
        console.log('Transmitted data: ', data);
      })
      .error(function(err, status) {
        console.log(err, status);
      });
  };

  var getMapBounds = function(map) {
    return map.getBounds();
  }

}])
