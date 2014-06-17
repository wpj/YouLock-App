angular.module('services', [])

.factory('Lockup', ['$http', function($http){

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
}]);