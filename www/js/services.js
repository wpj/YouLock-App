angular.module('services', [])

.factory('Lockup', ['$resource', '$http', function($resource, $http){

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
    submit: function(lockup, callback) {
      $http.post('http://localhost:8080/api/lockups', lockup).success(function(data) {
        callback(data);
      }).error(function(error) {
        console.log("Lockup submission failed.", error);
      })
    }
  };

  return Lockup;
}]);