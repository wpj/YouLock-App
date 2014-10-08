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

    # initialize map on controller instantiation
    # getPosition()

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
        showBackdrop: false

      $timeout ->
        $ionicLoading.hide()
      , 1000

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
        .then (response) ->
          sortedData = _.groupBy response.data, 'lockupType'
          userLockups = _.each sortedData[2], (lockup) -> lockup.icon = 'img/red.png'
          cityRacks = _.each sortedData[1], (lockup) -> lockup.icon = 'img/blue.png'
          sfRacks = _.each sortedData[3], (lockup) -> lockup.icon = 'img/blue.png'
          chiRacks = _.each sortedData[4], (lockup) -> lockup.icon = 'img/blue.png'
          dcRacks = _.each sortedData[5], (lockup) -> lockup.icon = 'img/blue.png'

          $scope.data.userLockups = if userLockups? then userLockups else []
          $scope.data.cityRacks = if cityRacks? then cityRacks else []
          $scope.data.sfRacks = if sfRacks? then sfRacks else []
          $scope.data.chiRacks = if chiRacks? then chiRacks else []
          $scope.data.dcRacks = if dcRacks? then dcRacks else []

        .catch (error) ->
          # console.log err, status

    # configure modals
    $ionicModal.fromTemplateUrl 'new-lockup.html',
      scope: $scope
      animation: 'slide-in-up'
    .then (modal) -> $scope.modal = modal

    $ionicModal.fromTemplateUrl 'lockup-info.html',
      scope: $scope
      animation: 'slide-in-up'
    .then (modal) -> $scope.infoModal = modal

    $ionicModal.fromTemplateUrl 'auth.html',
      scope: $scope
      animation: 'slide-in-up'
    .then (modal) -> $scope.authModal = modal

    # open modals

    $scope.openNewLockupForm = ->
      $ionicLoading.hide()
      $scope.data.lockup =
        description: ""
        address: ""
        location:
          type: "Point"
          coordinates: []
        rackAmount: 1
        lockupType: 2
      User.loggedIn()
        .then (user) ->
          $scope.modal.show()
          $scope.data.lockup.createdBy = user.id
          geolocate()
            .then (position) ->
              $scope.data.lockup.location.coordinates = [position.coords.longitude, position.coords.latitude]
            .catch (error) ->
              showLocationErrorAlert()
        .catch ->
          $scope.newLockupAttempt = true
          $scope.userMessages.authMessage = "required to add Lockup"    

    $scope.openLockupInfoModal = ($markerModel) ->
      $ionicLoading.hide()
      $scope.data.currentLockup = $markerModel
      $scope.infoModal.show()
      Analytics.incrementPageViews $scope.data.currentLockup

    $scope.showAuthModal = ->
      $scope.processingAuth = true
      $ionicLoading.hide()
      $scope.loginEnabled = true
      $scope.registrationEnabled = false
      $scope.authModal.show()
      User.loggedIn()
        .then (user) ->
          $scope.processingAuth = false
          $scope.currentUser = user
          $scope.loggedIn = true
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
        document.activeElement.blur()
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
            $ionicLoading.show
              template: 'The address you searched for was not found'
              duration: 800
              noBackdrop: true
]

.controller 'SubmissionCtrl',
  ['$scope', 'Lockup', 'geolocate', "$ionicLoading"
  ($scope, Lockup, geolocate, $ionicLoading) ->

    $scope.locationQuery = text: ""

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
            $ionicLoading.show
              template: 'Address not found'
              duration: 1000
              noBackdrop: true
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

    $scope.submitLockup = ->
      document.activeElement.blur()
      Lockup.submit $scope.data.lockup
        .then (data) ->
          if data.name is "ValidationError"
            $ionicLoading.show
              template: 'Lockup creation failed'
              duration: 800
              noBackdrop: true
          else
            data.data.icon = 'img/red.png'
            $ionicLoading.show
              template: 'Lockup created'
              duration: 800
              noBackdrop: true

            $scope.data.userLockups.push data.data
            $scope.modal.hide()

            $scope.data.lockup =
              description: ""
              address: ""
              location:
                type: "Point"
                coordinates: []
              rackAmount: 1
              createdBy: ""
              lockupType: 2

            $scope.locationQuery.text = ""

        .catch (error) ->
          $ionicLoading.show
            template: 'Lockup not created'
            duration: 100
            noBackdrop: true

    $scope.closeModal = ->
      $scope.modal.hide()
      $scope.clearGeocodeForm()
]

.controller 'LockupInfoCtrl',
  ['$scope', '$ionicPopup', '$ionicLoading', 'Report', ($scope, $ionicPopup, $ionicLoading, Report) ->
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
        .then (report) ->
          console.log report
          $ionicLoading.show
            template: 'Report submitted'
            duration: 800
            noBackdrop: true
        .catch (error) ->
          $ionicLoading.show
            template: 'Report submission failed'
            duration: 800
            noBackdrop: true
]

.controller 'AuthCtrl',
  ['$scope', 'User', ($scope, User) ->
    $scope.toggleAuthForm = ->
      $scope.userMessages.authMessage = ''
      $scope.loginEnabled = not $scope.loginEnabled
      $scope.registrationEnabled = not $scope.registrationEnabled

    $scope.closeAuthModal = ->
      $scope.authModal.hide()
      $scope.registration.email = ''
      $scope.registration.password = ''
      $scope.loginCreds.email = ''
      $scope.loginCreds.password = ''
      $scope.userMessages.authMessage = ''
      $scope.newLockupAttempt = false

    blur = (selector) ->
      nodeList = document.querySelectorAll selector
      _.each nodeList, (node) ->
        node.blur()

    $scope.register = ->
      blur '.authInput'
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
      blur '.authInput'
      User.login $scope.loginCreds
        .then (response) ->
          $scope.loggedIn = true
          $scope.currentUser = response.data.user
          $scope.loginCreds =
            email: ''
            password: ''
          if $scope.userMessages.authMessage
            $scope.userMessages.authMessage = ""
            $scope.newLockupAttempt = false if $scope.newLockupAttempt
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