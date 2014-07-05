angular.module('controllers', [])

.controller('MapCtrl', ['$scope', '$rootScope', '$ionicLoading', '$ionicModal', '$ionicPopup', '$cordovaGeolocation', '$cordovaKeyboard', 'Lockup', 'Report', 'User', 'Analytics', '$log', function($scope, $rootScope, $ionicLoading, $ionicModal, $ionicPopup, $cordovaGeolocation, $cordovaKeyboard, Lockup, Report, User, Analytics, underscore, $log) {
  
  // $scope initialization

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
    },
    icons: {
      userLockups: "img/ionic.png"
    }
  };

  $scope.locationQuery = {
    text: ""
  };

  $scope.searchText = "";

  $scope.cityRacks = [];
  $scope.userLockups = [];

  $scope.authMessage = "";

  // Location processing

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

      // send location to server for analytics
      Analytics.sendLocation(position.coords.latitude, position.coords.longitude);
    }, function(err) {
      console.log("Position not found.");
      $ionicLoading.hide();
      showLocationErrorAlert();
    });
  };

  showLocationErrorAlert = function() {
    var locationErrorPopup = $ionicPopup.alert({
      title: 'Not found!',
      template: "Your location couldn't be found."
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
        // $scope.lockups = _.filter(data, function(lockup) {
        //   var coords = new google.maps.LatLng(lockup.location.coordinates[1], lockup.location.coordinates[0]);
        //   return currentMapArea.contains(coords);
        // });

        var sortedData = _.groupBy(data, "lockupType");
        var cityRacksWithIcon = _.each(sortedData[1], function(lockup) {
          lockup.icon = 'img/blue.png';
        });
        var userLockupsWithIcon = _.each(sortedData[2], function(lockup) {
          lockup.icon = 'img/red.png';
        });

        $scope.cityRacks = cityRacksWithIcon ? cityRacksWithIcon : [];
        $scope.userLockups = userLockupsWithIcon ? userLockupsWithIcon : [];

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
    $ionicLoading.hide();
    $scope.lockup = {
      description: "",
      address: "",
      location: {
        type: "Point",
        coordinates: []
      },
      rackAmount: 1,
      lockupType: 2
    };
    User.loggedIn(function(user) {
      $scope.lockup.createdBy = user.id;
      geolocate(function(position) {
        $scope.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude];
      }, function(err) {
        if (err) console.log(err);
      });
      $scope.modal.show();
    }, function() {
      $scope.newLockupAttempt = true;
      $scope.authMessage = "required to add Lockup";
      $scope.showAuthModal();
    });
  };

  $scope.clearGeocodeForm = function() {
    $scope.locationQuery.text = "";
    $scope.lockup.location.coordinates = [];
    $scope.lockup.address = "";
    geolocate(function(position) {
      $scope.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude];
    }, function(err) {
      if (err) console.log(err);
    });
  };

  $scope.geocodeFormIsActive = function() {
    // originally returned .text.length, but the required form directive sets
    // the model it's associated with to null if you clear the form
    return $scope.locationQuery.text ? true : false;
  };

  $scope.processLocation = function() {

    if ($scope.locationQuery.text) {
      Lockup.geocode($scope.locationQuery.text).then(function(results) {
        $scope.lockup.location.coordinates = [ results[0].geometry.location.A, results[0].geometry.location.k ];
        var formattedAddress = results[0].formatted_address;
        $scope.lockup.address = formattedAddress;
        $scope.locationQuery.text = formattedAddress;
      }, function(err) {
        console.log("Address not found.");
      });
    } else if ($scope.locationQuery.text === undefined) {
      $scope.locationQuery.text = "";
      $scope.lockup.location.coordinates = [];
      $scope.lockup.address = "";
       geolocate(function(position) {
        $scope.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude];
        $scope.processLocation();
      }, function(err) {
        if (err) console.log(err);
      });
    } else {
      var coordRegexp = /^(\-?\d+\.\d+?),*(\-?\d+\.\d+?)$/;
      if (String($scope.lockup.location.coordinates).match(coordRegexp)) {
        var LatLngCoords = {
          lat: $scope.lockup.location.coordinates[1],
          lng: $scope.lockup.location.coordinates[0]
        };

        Lockup.reverseGeocode(LatLngCoords).then(function(results) {
          var formattedAddress = results[0].formatted_address;
          $scope.lockup.address = formattedAddress;
          $scope.locationQuery.text = formattedAddress;
        }, function(err) {
          // handle the error
        });
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
        data.icon = 'img/red.png';
        $ionicLoading.show({
          template: 'Lockup created',
          duration: 800,
          noBackdrop: true
        });
        $scope.userLockups.push(data);
        $scope.modal.hide();
        $scope.lockup = {
          description: "",
          address: "",
          location: {
            type: "Point",
            coordinates: []
          },
          rackAmount: 1,
          createdBy: "",
          lockupType: 2
        };
        $scope.locationQuery.text = "";
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

  $ionicModal.fromTemplateUrl('templates/auth.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.authModal = modal;
  });

  $scope.closeModal = function() {
    $scope.modal.hide();
    $scope.clearGeocodeForm();
  };

  // Lockup info
  // ===========================================================================

  // you must set data-tap-disabled to false, otherwise users can only open
  // one lockup modal and the app stops functioning.
  $scope.openLockupInfoModal = function($markerModel) {
    $ionicLoading.hide();
    $scope.currentLockup = $markerModel;
    console.log("$scope.currentLockup: ", $scope.currentLockup);
    $scope.infoModal.show();
    // increment the current lockup's page views on the server
    Analytics.incrementPageViews($scope.currentLockup);
  };

  $scope.closeLockupInfoModal = function() {
    $scope.infoModal.hide();
    $scope.currentLockup = {};
    $scope.reportLockupEnabled = false;
  };

  $scope.ifCityRack = function() {
    if ($scope.currentLockup) return $scope.currentLockup.lockupType === 1;
  };

  // Search
  // ===========================================================================

  $scope.searchIsActive = function() {
    return $scope.searchText.length;
  };

  $scope.resetSearch = function() {
    $scope.searchText = "";
  };

  $scope.searchLocation = function() {
    if ($scope.searchText.length) {
      $ionicLoading.show({
        content: '<i class="icon ion-loading-c"></i>',
        noBackdrop: true,
        showBackdrop: false
      });

      Lockup.geocode($scope.searchText).then(function(data) {
        $ionicLoading.hide();
        $scope.map.center = { latitude: data[0].geometry.location.k, longitude: data[0].geometry.location.A };
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) $cordovaKeyboard.close();
        // send geocoded address to server for analytics
        Analytics.sendAddress(data[0].geometry.location.k, data[0].geometry.location.A);
      }, function(err) {
        $ionicLoading.hide();
        console.log("Not found!");
      });
    }
  };

  // Reports
  //============================================================================

  $scope.showReportPopup = function() {
    // For whatever reason, this has to be an object. It can't be a string.
    $scope.lockupReport = {
      lockupId: $scope.currentLockup._id,
      missing: false,
      theft: false
    };

    var reportPopup = $ionicPopup.show({
      templateUrl: 'templates/report-popup.html',
      title: 'Send Report',
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
          type: 'button-assertive',
          onTap: function(e) {
            if (!$scope.lockupReport.description) {
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


  // authorization

  // Check if the user is logged in
  // var checkLoggedin = function(){

  //   var deferred = $q.defer();
  //   $http.get('http://localhost:8080/auth/loggedin').success(function(user) {
  //     if (user !== '0') return deferred.resolve(user);
  //     else {
  //       console.log("You need to log in.");
  //       return deferred.reject();
  //     }
  //   });
  //   return deferred.promise;
  // };

  $scope.toggleAuthForm = function() {
    $scope.authMessage = '';
    if ($scope.registrationEnabled === true) {
      $scope.registrationEnabled = false;
      $scope.loginEnabled = true;
    } else {
      $scope.registrationEnabled = true;
      $scope.loginEnabled = false;
    }
  };

  $scope.showAuthModal = function() {
    $ionicLoading.hide();
    $scope.loginEnabled = true;
    $scope.registrationEnabled = false;
    User.loggedIn(function(user) {
      $scope.currentUser = user;
      $scope.loggedIn = true;
      $scope.authModal.show();
    }, function() {
      $scope.loggedin = false;
      $scope.authModal.show();
    });
    $scope.registration = {
      email: '',
      password: ''
    };
    $scope.loginCreds = {
      email: '',
      password: ''
    };
  };

  $scope.closeAuthModal = function() {
    $scope.authModal.hide();
    $scope.registration.email = '';
    $scope.registration.password = '';
    $scope.loginCreds.email = '';
    $scope.loginCreds.password = '';
    $scope.authMessage = '';
    $scope.newLockupAttempt = false;
  };

  $scope.register = function() {
    User.register($scope.registration, function(data) {
      console.log(data);
    }, function(error) {
      console.log(error);
      $scope.authMessage = error.info.signupMessage;
    });
  };

  $scope.login = function() {
    User.login($scope.loginCreds, function(data) {
      $scope.loggedIn = true;
      $scope.currentUser = data.user;
      $scope.loginCreds = {
        email: '',
        password: ''
      };
      if ($scope.authMessage) {
        $scope.authMessage = "";
        if ($scope.newLockupAttempt) {
          $scope.closeAuthModal();
          $scope.newLockup();
          $scope.newLockupAttempt = false;
        }
      }
    }, function(error) {
      $scope.authMessage = error.info.loginMessage;
      console.log("Error: ", error);
    });
  };

  $scope.logout = function() {
    User.logout(function(data) {
      $scope.loggedIn = false;
      console.log(data);
    }, function(error) {
      console.log(error);
    });
  };


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
