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
    }
  };

  return Lockup;
}]);