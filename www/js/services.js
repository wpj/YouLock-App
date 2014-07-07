angular.module('services', [])

.factory('Lockup', ['$http', '$q', 'ServerUrl', function($http, $q, ServerUrl){

  var Lockup = {
    findAll: function() {
      return $http.get(ServerUrl + 'api/lockups');
    },
    findInMapArea: function(SWLng, SWLat, NELng, NELat) {
      return $http.get(ServerUrl + 'api/lockups', {
        params: {
          filtered: true,
          SWLng: SWLng,
          SWLat: SWLat,
          NELng: NELng,
          NELat: NELat
        }
      });
    },
    submit: function(lockup, callback, errCb) {
      $http.post(ServerUrl + 'api/lockups', lockup).success(function(data) {
        callback(data);
      }).error(function(error) {
        errCb(error);
      });
    },
    geocode: function(address) {
      var geocoder = new google.maps.Geocoder();
      var deferred = $q.defer();
      geocoder.geocode({ address: address }, function(results, status) {
        if (status === "OK") {
          return deferred.resolve(results);
        } else {
          return deferred.reject();
        }
      });
      return deferred.promise;
    },
    reverseGeocode: function(coords) {
      var geocoder = new google.maps.Geocoder();
      var deferred = $q.defer();
      geocoder.geocode({ latLng: coords }, function(results, status) {
        if (status === "OK") {
          return deferred.resolve(results);
        } else {
          return deferred.reject();
        }
      });
      return deferred.promise;
    }
  };

  return Lockup;
}])

.factory('Report', ['$http', 'ServerUrl', function($http, ServerUrl) {
  
  var Report = {
    submit: function(report, callback, errCb) {
      $http.post(ServerUrl + 'api/reports', report).success(function(data) {
        callback(data);
      }).error(function(error) {
        errCb(err);
      });
    }
  };

  return Report;
}])

.factory('User', ['$http', 'ServerUrl', function($http, ServerUrl) {
  var User = {
    register: function(credentials, callback, errCb) {
      $http.post(ServerUrl + 'auth/signup', credentials).success(function(data) {
        callback(data);
      }).error(function(err) {
        errCb(err);
      });
    },
    login: function(credentials, callback, errCb) {
      $http.post(ServerUrl + 'auth/login', credentials).success(function(data) {
        callback(data);
      }).error(function(err) {
        errCb(err);
      });
    },
    logout: function(callback, errCb) {
      $http.get(ServerUrl + 'auth/logout').success(function(data) {
        callback(data);
      }).error(function(error) {
        errCb(error);
      });
    },
    loggedIn: function(loggedInCb, notLoggedInCb) {
      $http.get(ServerUrl + 'auth/loggedin').success(function(user) {
        if (user !== '0') {
          loggedInCb(user);
        } else {
          notLoggedInCb();
        }
      }).error(function(err) {
        console.log(err);
      });
    }
  };

  return User;
}])

.factory('Analytics', ['$http', 'ServerUrl', function($http, ServerUrl) {
  var Analytics = {
    incrementPageViews: function(lockup) {
      $http.get(ServerUrl + 'api/analytics/lockups/' + lockup._id).success(function(response) {
        console.log(response);
      }).error(function(err) {
        console.log(err);
      });
    },
    sendLocation: function(lat, lng) {
      $http.get(ServerUrl + 'api/analytics/search/location', {
        params: {
          lat: lat,
          lng: lng
        }
      }).success(function(response) {
        console.log(response);
      }).error(function(err) {
        console.log(err);
      });
    },
    sendAddress: function(lat, lng) {
      $http.get(ServerUrl + 'api/analytics/search/address', {
        params: {
          lat: lat,
          lng: lng
        }
      }).success(function(response) {
        console.log(response);
      }).error(function(err) {
        console.log(err);
      });
    }
  };
  return Analytics;
}])

// .constant('ServerUrl', 'http://youlock.herokuapp.com/');
.constant('ServerUrl', 'http://localhost:8080/');

// .factory('Geocode', ['$q', function($q) {
  
//   var Geocode = {
//     fromAddress: function(address, callback) {
//       var geocoder = new google.maps.Geocoder();
//       geocoder.geocode({ address: address }, function(results, status) {
//         callback(results, status);
//       });
//     },
//     fromCoords: function(coords) {
//       var geocoder = new google.maps.Geocoder();
//       var deferred = $q.defer();
//       geocoder.geocode({ latLng: coords }, function(results, status) {
//         if (status === "OK") {
//           return deferred.resolve(results);
//         }
//         return deferred.reject();
//       });
//       return deferred.promise();
//     }
//   };

//   return Geocode;
// }]);