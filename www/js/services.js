angular.module('services', [])

.factory('Lockup', ['$resource', function($resource){
  return $resource('http://localhost:8080/api/lockups/:lockup_id');
}]);