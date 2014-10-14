angular.module('youLock', ['ionic', 'google-maps', 'controllers', 'directives', 'services', 'ngCordova', 'ngAutocomplete'])

.run ['$ionicPlatform', ($ionicPlatform) ->
  $ionicPlatform.ready ->
    if window.cordova && window.cordova.plugins.Keyboard
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true)
    if window.StatusBar
      StatusBar.styleDefault()
]

angular.element document
  .ready ->
    document.addEventListener 'deviceready', ->
      angular.bootstrap document, ['youLock']
