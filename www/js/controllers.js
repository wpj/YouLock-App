angular.module('controllers', [])

.controller('MapCtrl', ['$scope', '$rootScope', '$ionicLoading', '$ionicModal', '$ionicPopup', '$cordovaGeolocation', '$cordovaKeyboard', 'Lockup', 'Report', '$log', function($scope, $rootScope, $ionicLoading, $ionicModal, $ionicPopup, $cordovaGeolocation, $cordovaKeyboard, Lockup, Report, underscore, $log) {
  
  // map initialization

  $scope.map = {
    control: {},
    zoom: 16,
    options: {
      disableDefaultUI: true
    },
    idKey: '_id',
    events: {
      idle: function(map, event, eventArgs) {
        searchInMapBounds(map);
      }
    }
  };

  // Location processing

  // var getPosition = function() {
  //   $cordovaGeolocation.getCurrentPosition().then(function(position) {
  //     $scope.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude];
  //   });
  // };

  var geolocate = function(success, errCb) {
    $cordovaGeolocation.getCurrentPosition().then(function(position) {
      success(position);
    }, function(err) {
      errCb(err);
    });
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

    geolocate(function(position) {
      console.log('Got position', position);
      $scope.map.center = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      $scope.map.zoom = 17;
      $ionicLoading.hide();
    }, function(err) {
      console.log("Position not found.");
      $ionicLoading.hide();
      showLocationErrorAlert();
    });
  };

  showLocationErrorAlert = function() {
    var locationErrorPopup = $ionicPopup.alert({
      title: 'Not found!',
      template: 'Your location couldn\'t be found.'
    });
  };

  // Pulling Lockups from server
  // ===========================================================================

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

  var getMapBounds = function(map) {
    return map.getBounds();
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


        // Server data logging
        // console.log('Number of objects in $scope.lockups', $scope.lockups.length);
        // console.log('$scope.lockups: ',$scope.lockups);
        // console.log('Lockups received: ', data.length);
        // console.log('Transmitted data: ', data);
      })
      .error(function(err, status) {
        console.log(err, status);
      });
  };

  // Lockup submission
  // ===========================================================================

  $scope.newLockup = function() {
    geolocate(function(position) {
      $scope.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude];
    }, function(err) {
      if (err) console.log(err);
    });
    $scope.modal.show();
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

  $scope.processLocation = function() {
    if (!$scope.lockup.location.coordinates) {
      geolocate(function(position) {
        $scope.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude];
      }, function(err) {
        if (err) console.log(err);
      });
    } else {
      var coordRegexp = /^(\-?\d+\.\d+?),*(\-?\d+\.\d+?)$/;
      if (String($scope.lockup.location.coordinates).match(coordRegexp)) {
        // still need to reverse-geocode this
        $scope.searchText = $scope.lockup.location.coordinates;
      } else if ($scope.searchText.length) {

      } else {
        console.log("Error");
      }
    }
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

  // General modal logic
  // ===========================================================================

  $ionicModal.fromTemplateUrl('templates/new-lockup.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/lockup-info.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.infoModal = modal;
  });

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  // Lockup info
  // ===========================================================================

  // you must set data-tap-disabled to false, otherwise users can only open
  // one lockup modal and the app stops functioning.
  $scope.openLockupInfoModal = function($markerModel) {
    $scope.currentLockup = $markerModel;
    console.log("$scope.currentLockup: ", $scope.currentLockup);
    $scope.infoModal.show();
  };

  $scope.closeLockupInfoModal = function() {
      $scope.infoModal.hide();
      $scope.currentLockup = {};
      $scope.reportLockupEnabled = false;
  };

  // Search
  // ===========================================================================

  $scope.searchText = "";

  $scope.searchIsActive = function() {
    return $scope.searchText.length;
  };

  $scope.resetSearch = function() {
    $scope.searchText = "";
  };

  var geocode = function(callback) {
    var Geocoder = new google.maps.Geocoder();
    Geocoder.geocode({
      address: $scope.searchText
    }, function(results, status) {
      callback(results, status);
    });
  };

  $scope.searchLocation = function() {
    if ($scope.searchText.length) {
      $ionicLoading.show({
        content: '<i class="icon ion-loading-c"></i>',
        noBackdrop: true,
        showBackdrop: false
      });

      geocode(function(data, status) {
        if (status === "OK") {
          $ionicLoading.hide();
          $scope.map.center = { latitude: data[0].geometry.location.k, longitude: data[0].geometry.location.A };
          if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) $cordovaKeyboard.close();
        } else {
          // MAKE A BETTER UI FEATURE HERE
          $ionicLoading.hide();
          console.log("Not found!");
        }
      });
    }
  };

  // Reports
  //============================================================================

  $scope.showReportPopup = function() {
    // For whatever reason, this has to be an object. It can't be a string.
    $scope.lockupReport = {
      lockupId: $scope.currentLockup._id
    };

    var reportPopup = $ionicPopup.show({
      template: '<textarea class="lockupReport" ng-model="lockupReport.reportDescription" rows="5" placeholder="Reason for reporting"></textarea>',
      title: 'Report Lockup',
      scope: $scope,
      buttons: [
        {
          text: 'Cancel',
          onTap: function(e) {
            return 'Cancelled';
          }
        },
        {
          text: '<b>Submit</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.lockupReport.reportDescription) {
              // only allow the user to submit report if they've entered text
              e.preventDefault();
            } else {
              submitReport();
              return $scope.lockupReport;
            }
          }
        },
      ]
    });
   };

  var submitReport = function() {
    Report.submit($scope.lockupReport, function(report) {
      console.log("Report submitted!", report);
    }, function(error) {
      console.log(error);
    });
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

}]);
