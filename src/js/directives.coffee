angular.module('directives', [])

# can only be called on a form element
.directive 'blurInputs', ->
  (scope, elem, attrs) ->
    elem.on 'submit', (e) ->
      _.each elem.find('input'), (node) ->
        node.blur()
