angular.module('controllers', [])

.controller 'MapCtrl',
  ['$scope', '$rootScope', '$timeout', '$ionicLoading', '$ionicModal', '$ionicPopup', 'Lockup', 'Report', 'User', 'Analytics', 'geolocate',
  ($scope, $rootScope, $timeout, $ionicLoading, $ionicModal, $ionicPopup, Lockup, Report, User, Analytics, geolocate) ->

    $scope.map =
      control: {}
      zoom: 16
      options:
        disableDefaultUI: true
        minZoom: 14
      idKey: '_id'
      events:
        idle: (map, event, eventArgs) -> searchInMapBounds map
      icons: userLockups: "img/ionic.png"

    $scope.searchText = ""

    $scope.data = {}
    $scope.userMessages = {}
    $scope.status = {}

    # map functions

    showLocationErrorAlert = ->
      $ionicLoading.hide()
      locationErrorPopup = $ionicPopup.alert
        title: 'Not found!'
        template: "Your location couldn't be found."

    getPosition = ->
      return unless $scope.map

      $ionicLoading.show
        content: '<i class="icon ion-loading-c"></i>'
        noBackdrop: true
        showBackdrop: false,
        duration: 1000

      geolocate()
        .then (position) ->
          $scope.map.center = latitude: position.coords.latitude, longitude: position.coords.longitude
          $scope.map.zoom = 17
          $ionicLoading.hide()
          Analytics.sendLocation position.coords.latitude, position.coords.longitude

        .catch (err) ->
          $ionicLoading.hide()
          $scope.map.center = latitude: 40.735666, longitude: -73.990341
          $scope.map.zoom = 16
          showLocationErrorAlert()

    # initialize map on controller instantiation
    getPosition()
    
    $scope.getPosition = getPosition

    searchInMapBounds = (map) ->
      currentMapArea = map.getBounds()
      northEast = currentMapArea.getNorthEast()
      southWest = currentMapArea.getSouthWest()

      SWLng = southWest.lng()
      SWLat = southWest.lat()
      NELng = northEast.lng()
      NELat = northEast.lat()

      Lockup.findInMapArea SWLng, SWLat, NELng, NELat
        .then (data) ->
          $scope.data.userLockups = if data.userLockups? then data.userLockups else []
          $scope.data.cityRacks = if data.cityRacks? then data.cityRacks else []
          $scope.data.sfRacks = if data.sfRacks? then data.sfRacks else []
          $scope.data.chiRacks = if data.chiRacks? then data.chiRacks else []
          $scope.data.dcRacks = if data.dcRacks? then data.dcRacks else []

        .catch (error) ->
          # TODO: handle error

    # configure modals
    $ionicModal.fromTemplateUrl 'lockup-info.html',
      scope: $scope
      animation: 'slide-in-up'
    .then (modal) -> $scope.infoModal = modal

    $ionicModal.fromTemplateUrl 'dashboard.html',
      scope: $scope
      animation: 'slide-in-up'
    .then (modal) -> $scope.dashboard = modal

    # open modals
    $scope.openLockupInfoModal = ($markerModel) ->
      $ionicLoading.hide()
      $scope.data.currentLockup = $markerModel
      $scope.infoModal.show()
      Analytics.incrementPageViews $scope.data.currentLockup

    $scope.openDashboard = ->
      $scope.processingAuth = true
      $ionicLoading.hide()
      $scope.loginEnabled = true
      $scope.registrationEnabled = false
      $scope.dashboard.show()
      User.loggedIn()
        .then (user) ->
          $scope.processingAuth = false
          $scope.currentUser = user
          $scope.loggedIn = true
          $scope.data.lockup.createdBy = user.id
        .catch (error) ->
          $scope.processingAuth = false
          $scope.loggedIn = false

      $scope.registration =
        email: ''
        password: ''

      $scope.loginCreds =
        email: ''
        password: ''
    

    # Search

    $scope.searchIsActive = -> $scope.searchText.length

    $scope.resetSearch = -> $scope.searchText = ""

    $scope.searchLocation = ->
      if $scope.searchText.length
        $ionicLoading.show
          content: '<i class="icon ion-loading-c></i>'
          noBackdrop: true
          showBackdrop: false

        Lockup.geocode $scope.searchText
          .then (data) ->
            $ionicLoading.hide()
            $scope.map.center =
              latitude: data[0].geometry.location.k
              longitude: data[0].geometry.location.A
            Analytics.sendAddress data[0].geometry.location.k, data[0].geometry.location.A
          .catch (error) ->
            $ionicLoading.hide()
            $ionicPopup.alert
              title: 'Not found!'
              template: 'The address you searched for was not found.'
]

.controller 'DashboardCtrl',
  ['$scope', 'User', ($scope, User) ->
    $scope.toggleAuthForm = ->
      $scope.userMessages.authMessage = ''
      $scope.loginEnabled = not $scope.loginEnabled
      $scope.registrationEnabled = not $scope.registrationEnabled

    $scope.closeDashboard = ->
      $scope.dashboard.hide()
      $scope.registration.email = ''
      $scope.registration.password = ''
      $scope.loginCreds.email = ''
      $scope.loginCreds.password = ''
      $scope.userMessages.authMessage = ''

    $scope.register = ->
      User.register $scope.registration
        .then (response) ->
          $scope.loggedIn = true
          $scope.currentUser = response.data.user
          $scope.registrationEnabled = false
          $scope.loginEnabled = true
          $scope.registration =
            email: ''
            password: ''
        .catch (error) ->
          console.log error
          $scope.userMessages.authMessage = error.data.info.signupMessage or "username/password invalid"

    $scope.login = ->
      User.login $scope.loginCreds
        .then (response) ->
          $scope.loggedIn = true
          $scope.currentUser = response.data.user
          $scope.loginCreds =
            email: ''
            password: ''
          if $scope.userMessages.authMessage
            $scope.userMessages.authMessage = ""
        .catch (error) ->
          console.log error
          $scope.userMessages.authMessage = error.data.info.loginMessage or "email/password is incorrect"

    $scope.logout = ->
      User.logout()
        .then (data) ->
          $scope.loggedIn = false
        .catch (error) ->
          # console.log error
]

.controller 'SubmissionCtrl',
  ['$scope', 'Lockup', 'geolocate', '$ionicPopup',
  ($scope, Lockup, geolocate, $ionicPopup) ->

    $scope.locationQuery = text: ""

    $scope.data.lockup =
      description: ""
      address: ""
      location:
        type: "Point"
        coordinates: []
      rackAmount: 1
      lockupType: 2

    geolocate()
      .then (position) ->
        $scope.data.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude]
      .catch (error) -> showLocationErrorAlert()

    $scope.clearGeocodeForm = ->
      $scope.locationQuery.text = ""
      $scope.data.lockup.location.coordinates = []
      $scope.data.lockup.address = ""
      geolocate()
        .then (position) ->
          $scope.processingLocation = false
          $scope.data.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude]
        .catch (error) ->
          console.log error

    $scope.geocodeFormIsActive = ->
      if $scope.locationQuery.text then true else false

    $scope.processLocation = ->
      $scope.processingLocation = true
      if $scope.locationQuery.text
        Lockup.geocode $scope.locationQuery.text
          .then (results) ->
            $scope.processingLocation = false
            $scope.data.lockup.location.coordinates = [results[0].geometry.location.A, results[0].geometry.location.k]
            formattedAddress = results[0].formatted_address
            $scope.data.lockup.address = formattedAddress
            $scope.locationQuery.text = formattedAddress
          .catch (error) ->
            $ionicPopup.alert
              title: 'Not found!'
              template: 'The address you searched for was not found'
      else if $scope.locationQuery.text is undefined
        $scope.locationQuery.text = ""
        $scope.data.lockup.location.coordinates = []
        $scope.data.lockup.address = ""
        geolocate()
          .then (position) ->
            $scope.processingLocation = false
            $scope.data.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude]
            $scope.processLocation()
          .catch (error) ->
            showLocationErrorAlert()
      else
        coordRegexp = /^(\-?\d+\.\d+?),*(\-?\d+\.\d+?)$/
        if String($scope.data.lockup.location.coordinates).match coordRegexp
          LatLngCoords =
            lat: $scope.data.lockup.location.coordinates[1]
            lng: $scope.data.lockup.location.coordinates[0]

          Lockup.reverseGeocode LatLngCoords
            .then (results) ->
              $scope.processingLocation = false
              formattedAddress = results[0].formatted_address
              $scope.data.lockup.address = formattedAddress
              $scope.locationQuery.text = formattedAddress
            .catch (err) ->
              # handle error
        else
          geolocate()
            .then (position) ->
              $scope.processingLocation = false
              $scope.data.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude]
              $scope.processLocation()
            .catch (error) ->
              showLocationErrorAlert()

    $scope.submitLockup = ->
      # possible put back blur on form input elements
      Lockup.submit $scope.data.lockup
        .then (data) ->
          if data.data.name is "ValidationError"
            $ionicPopup.alert
              title: 'Lockup creation failed!'
              template: 'There was an issue, please try again.'
          else
            data.data.icon = 'img/red.png'

            $scope.data.userLockups.push data.data
            $scope.dashboard.hide()

            $scope.data.lockup =
              description: ""
              address: ""
              location:
                type: "Point"
                coordinates: []
              rackAmount: 1
              lockupType: 2

            $scope.locationQuery.text = ""

        .catch (error) ->
          $ionicPopup.alert
            title: 'Lockup creation failed!'
            template: 'There was an issue, please try again.'

    $scope.closeModal = ->
      $scope.modal.hide()
      $scope.clearGeocodeForm()
]

.controller 'LockupInfoCtrl',
  ['$scope', '$ionicPopup', 'Report',
  ($scope, $ionicPopup, Report) ->
    $scope.closeLockupInfoModal = ->
      $scope.infoModal.hide()
      $scope.data.currentLockup = {}
      $scope.reportLockupEnabled = false

    $scope.ifUserLockup = -> $scope.data.currentLockup?.lockupType is 2
    $scope.ifCityRack = -> $scope.data.currentLockup?.lockupType is 1
    $scope.ifSFRack = -> $scope.data.currentLockup?.lockupType is 3
    $scope.ifChiRack = -> $scope.data.currentLockup?.lockupType is 4
    $scope.ifDCRack = -> $scope.data.currentLockup?.lockupType is 5

    
    # Lockup reports
    $scope.showReportPopup = ->
      $scope.lockupReport =
        lockupId: $scope.data.currentLockup._id
        missing: false
        theft: false

      reportPopup = $ionicPopup.show
        templateUrl: 'report-popup.html'
        title: 'Send report'
        scope: $scope
        buttons: [
          {
            text: 'Cancel'
            onTap: (e) -> 'Cancelled'
          },
          {
            text: '<b>Submit</b>'
            type: 'button-assertive'
            onTap: (e) ->
              unless $scope.lockupReport.description
                e.preventDefault()
              else
                submitReport()
                $scope.lockupReport
          }
        ]

    submitReport = ->
      document.activeElement.blur()
      Report.submit $scope.lockupReport
        .catch (error) ->
          $ionicPopup.alert
              title: 'Report submission failed!'
              template: 'There was an issue, please try again.'
]
