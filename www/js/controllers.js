angular.module('controllers', [])

.controller('MapCtrl', ['$scope', '$ionicLoading', '$ionicModal', '$cordovaGeolocation', 'Lockup', function($scope, $ionicLoading, $ionicModal, $cordovaGeolocation, Lockup, underscore, $log){
  $scope.map = {
    control: {},
    center: {
      latitude: 50.677380, 
      longitude: -73.976949
    },
    // center: currentLocation,
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
      $scope.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude];
    });
  };

  angular.element(document).ready(function() {
    $cordovaGeolocation.getCurrentPosition().then(function(position) {
      // console.log(position);
      currentLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude }
      $scope.currentLocation = [position.coords.latitude, position.coords.longitude];
      $scope.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude];
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
      $scope.currentLocation = [position.coords.latitude, position.coords.longitude];
      $scope.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude];
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

         // Logic for caching markers already on the map (doesn't work yet) 

        /*if (!$scope.lockups) {
          $scope.lockups = data;
        } else {
          var newData = _.filter(data, function(lockup) {
            var coords = new google.maps.LatLng(lockup.coordinates[1], lockup.coordinates[0]);
            return currentMapArea.contains(coords);
          });
          $scope.lockups.push(newData);
        };*/


        console.log('Number of objects in $scope.lockups', $scope.lockups.length);
        console.log('$scope.lockups: ',$scope.lockups);
        console.log('Lockups received: ', data.length);
        console.log('Transmitted data: ', data);
      })
      .error(function(err, status) {
        console.log(err, status);
      });
  };

  var getMapBounds = function(map) {
    return map.getBounds();
  }

  $ionicModal.fromTemplateUrl('new-lockup.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $ionicModal.fromTemplateUrl('lockup-info.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.infoModal = modal;
  });

  $scope.newLockup = function() {
    getPosition();
    $scope.modal.show();
  };

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  $scope.lockup = {
    name: "",
    address: "",
    location: {
      type: "Point",
      coordinates: []
    },
    rackAmount: 1,
    createdBy: "User",
  };

  $scope.submitLockup = function() {
    Lockup.submit($scope.lockup, function(data) {
      if (data.name === "ValidationError") {
        $ionicLoading.show({
          template: 'Lockup creation failed',
          duration: 800,
          noBackdrop: true
        });
      } else {
        $ionicLoading.show({
          template: 'Lockup created',
          duration: 800,
          noBackdrop: true
        });
        $scope.lockups.push(data);
        $scope.modal.hide();
        $scope.lockup = {
          name: "",
          address: "",
          location: {
            type: "Point",
            coordinates: []
          },
          rackAmount: 1,
          createdBy: "User",
        };
      }
    }, function(err) {
      console.log("Lockup not created!", err);
    });
  };

  $scope.closeLockupInfoModal = function() {
      $scope.infoModal.hide();
      // delete $scope.currentLockup;
      $scope.currentLockup = {};
      console.log("$scope.currentLockup: ", $scope.currentLockup);
  };

  // you must set data-tap-disabled to false, otherwise users can only open
  // one lockup modal and the app stops functioning.
  $scope.openLockupInfoModal = function($markerModel) {
    $scope.currentLockup = $markerModel;
    console.log("$scope.currentLockup: ", $scope.currentLockup);
    $scope.infoModal.show();
  };

  // ===========================================================================
  // 

  // $scope.lockupsEvents = {
  //   mousedown: function(marker, eventName, lockup) {
  //     console.log("Modal window lockup: ", lockup);
  //     openLockupInfoModal(lockup);
  //   }
  // };

  // var openLockupInfoModal = function(lockup) {
  //   $scope.currentLockup = lockup;
  //   console.log("$scope.currentLockup: ", $scope.currentLockup);
  //   $scope.infoModal.show();
  // };

  // ===========================================================================
  // $scope.lockups = [ { _id: 1,
  //   name: '116 2ND AVE',
  //   address: '116 2ND AVE, New York, NY 10003, USA',
  //   rackAmount: 1,
  //   createdBy: 'NYCDOT',
  //   location: { type: 'Point', coordinates: [ -73.987842, 40.727731 ] } },
  // { _id: 2,
  //   name: '120 2ND AVE',
  //   address: '120 2ND AVE, New York, NY 10003, USA',
  //   rackAmount: 1,
  //   createdBy: 'NYCDOT',
  //   location: { type: 'Point', coordinates: [ -73.98764, 40.727999 ] } },
  // { _id: 3,
  //   name: '122 2ND AVE',
  //   address: '122 2ND AVE, New York, NY 10003, USA',
  //   rackAmount: 2,
  //   createdBy: 'NYCDOT',
  //   location: { type: 'Point', coordinates: [ -73.987593, 40.728061 ] } } ]

}])
