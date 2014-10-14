angular.module('services', [])

.factory 'Lockup', ['$http', '$q', 'ServerUrl', ($http, $q, ServerUrl) ->
  geocoder = new google.maps.Geocoder()

  # service methods
  findAll: ->
    $http.get "{ServerUrl}api/lockups"

  findInMapArea: (SWLng, SWLat, NELng, NELat) ->
    $http.get "#{ServerUrl}api/lockups",
      params:
        filtered: true
        SWLng: SWLng
        SWLat: SWLat
        NELng: NELng
        NELat: NELat
    .then (response) ->
      sortedData = _.groupBy response.data, 'lockupType'

      userLockups: _.each sortedData[2], (lockup) -> lockup.icon = 'img/red.png'
      cityRacks: _.each sortedData[1], (lockup) -> lockup.icon = 'img/blue.png'
      sfRacks: _.each sortedData[3], (lockup) -> lockup.icon = 'img/blue.png'
      chiRacks: _.each sortedData[4], (lockup) -> lockup.icon = 'img/blue.png'
      dcRacks: _.each sortedData[5], (lockup) -> lockup.icon = 'img/blue.png'

    # .catch (error) ->

  submit: (lockup) ->
    $http.post "#{ServerUrl}api/lockups", lockup

  geocode: (address) ->
    deferred = $q.defer()
    geocoder.geocode address: address, (results, status) ->
      if status is "OK" then deferred.resolve results
      else deferred.reject()
    deferred.promise

  reverseGeocode: (coords) ->
    deferred = $q.defer()
    geocoder.geocode latLng: coords, (results, status) ->
      if status is "OK" then deferred.resolve results
      else deferred.reject()
    deferred.promise
]

.factory 'Report', ['$http', 'ServerUrl', ($http, ServerUrl) ->
  submit: (report) ->
    $http.post "#{ServerUrl}api/reports", report
]

.factory 'User', ['$http', '$q', 'ServerUrl', ($http, $q, ServerUrl) ->
  register: (credentials) ->
    $http.post "#{ServerUrl}auth/signup", credentials

  login: (credentials) ->
    $http.post "#{ServerUrl}auth/login", credentials

  logout: (credentials) ->
    $http.get "#{ServerUrl}auth/logout"

  loggedIn: ->
    deferred = $q.defer()
    $http.get "#{ServerUrl}auth/loggedin"
      .then (response) ->
        if response.data is '0' then deferred.reject 'not logged in'
        else deferred.resolve response.data
      .catch (error) ->
        deferred.reject error

    deferred.promise
]

.factory 'Analytics', ['$http', 'ServerUrl', ($http, ServerUrl) ->
  incrementPageViews: (lockup) ->
    $http.get "#{ServerUrl}api/analytics/lockups/#{lockup._id}"

  sendLocation: (lat, lng) ->
    $http.get "#{ServerUrl}api/analytics/search/location",
      params:
        lat: lat
        lng: lng

  sendAddress: (lat, lng) ->
    $http.get "#{ServerUrl}api/analytics/search/address",
      params:
        lat: lat
        lng: lng
]

.factory 'geolocate', ['$cordovaGeolocation', ($cordovaGeolocation) ->
  -> $cordovaGeolocation.getCurrentPosition maximumAge: 0
]

# .constant 'ServerUrl', 'http://www.youlock.co/'
.constant 'ServerUrl', 'http://192.168.1.35:8080/'
