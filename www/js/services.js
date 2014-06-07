angular.module('services', [])

.factory('Lockup', ['$resource', '$http', function($resource, $http){
  // return $resource('http://localhost:8080/api/lockups/:lockup_id', {}, {'query': {'method': 'GET', isArray: true} });

  var Lockup = {
    findAll: function() {
      return $http.get('http://localhost:8080/api/lockups');
    },
    findInMapArea: function(mapBounds) {
      return $http.get('http://localhost:8080/api/lockups', {
        params: { map_bounds: mapBounds }
      });
    }
  };

  return Lockup;
}]);