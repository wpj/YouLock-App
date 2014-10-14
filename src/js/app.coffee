angular.module('youLock', ['ionic', 'google-maps', 'controllers', 'directives', 'services', 'ngCordova', 'ngAutocomplete'])

.config ['$httpProvider', '$sceDelegateProvider', ($httpProvider, $sceDelegateProvider) ->
  # $httpProvider.responseInterceptors.push ['$q', ($q) ->
  #   (promise) ->
  #     promise
  #     .then (response) ->
  #       response
  #     .catch (error) ->
  #       if response.status is 401 then console.log response
  #       $q.reject response
  # ]

  # $httpProvider.defaults.withCredentials = true
  # $httpProvider.defaults.transformResponse
  # $httpProvider.defaults.useXDomain = true
  # delete $httpProvider.defaults.headers.common['X-Requested-With']
  # $sceDelegateProvider.resourceUrlWhitelist ['self', 'http://localhost:8080/**']
]

.run ['$ionicPlatform', ($ionicPlatform) ->
  $ionicPlatform.ready ->
    if window.cordova && window.cordova.plugins.Keyboard
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true)
    if window.StatusBar
      StatusBar.styleDefault()
]

angular.element document
  .ready ->
    # document.addEventListener 'deviceready', ->
      # console.log 'deviceready'
    angular.bootstrap document, ['lockupFront']
