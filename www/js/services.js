angular.module('services', [])

.factory('Lockup', ['$http', '$q', function($http, $q){

  var Lockup = {
    findAll: function() {
      return $http.get('http://localhost:8080/api/lockups');
    },
    findInMapArea: function(SWLng, SWLat, NELng, NELat) {
      return $http.get('http://localhost:8080/api/lockups', {
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
      $http.post('http://localhost:8080/api/lockups', lockup).success(function(data) {
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

.factory('Report', ['$http', function($http) {
  
  var Report = {
    findAll: function() {
      return $http.get('http://localhost:8080/api/reports');
    },
    submit: function(report, callback, errCb) {
      $http.post('http://localhost:8080/api/reports', report).success(function(data) {
        callback(data);
      }).error(function(error) {
        errCb(err);
      });
    }
  };

  return Report;
}])

.factory('User', ['$http', function($http) {
  var User = {
    register: function(credentials, callback, errCb) {
      $http.post('http://localhost:8080/auth/signup', credentials).success(function(data) {
        callback(data);
      }).error(function(err) {
        errCb(err);
      });
    },
    login: function(credentials, callback, errCb) {
      $http.post('http://localhost:8080/auth/login', credentials).success(function(data) {
        callback(data);
      }).error(function(err) {
        errCb(err);
      });
    },
    logout: function(callback, errCb) {
      $http.get('http://localhost:8080/auth/logout').success(function(data) {
        callback(data);
      }).error(function(error) {
        errCb(error);
      });
    },
    loggedIn: function(loggedInCb, notLoggedInCb) {
      $http.get('http://localhost:8080/auth/loggedin').success(function(user) {
        if (user !== '0') {
          loggedInCb();
        } else {
          notLoggedInCb();
        }
      }).error(function(err) {
        console.log(err);
      });
    }
  };

  return User;
}]);

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