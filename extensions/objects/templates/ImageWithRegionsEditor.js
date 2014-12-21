// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

// TODO(czx): Uniquify the labels of image regions
oppia.directive('imageWithRegionsEditor', [
  '$rootScope', '$sce', '$compile', 'warningsData', function($rootScope, $sce, $compile, warningsData) {
    return {
      link: function(scope, element, attrs) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_TEMPLATES_URL + scope.$parent.objType;
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: true,
      template: '<div ng-include="getTemplateUrl()"></div>',
      controller: function($scope, $element, $attrs) {
        $scope.alwaysEditable = true;

        $scope.REGION_LABEL_OFFSET_X = 3;
        $scope.REGION_LABEL_OFFSET_Y = 12;

        //All coordinates have origin at top-left, increasing in x to the right and increasing in y down
        // Current mouse position in SVG coordinates
        $scope.mouseX = $scope.mouseY = 0;
        // Original mouse click position for rectangle drawing
        $scope.origX = $scope.origY = 0;
        // Coordinates for currently drawn rectangle (when user is dragging)
        $scope.rectX = $scope.rectY = 0;
        $scope.rectWidth = $scope.rectHeight = 0;
        // Is user currently dragging?
        $scope.userIsCurrentlyDragging = false;
        // Dimensions of image
        $scope.imageWidth = $scope.imageHeight = 0;

        $scope.getPreviewUrl = function(imageUrl) {
          return $sce.trustAsResourceUrl(
            '/imagehandler/' + $rootScope.explorationId + '/' +
            encodeURIComponent(imageUrl)
          );
        };

        $scope.$watch('$parent.value.imagePath', function(newVal) {
          if (newVal === '') {
            return;
          }
          // Loads the image in hanging <img> tag so as to get the
          // width and height
          $('<img/>').attr('src', $scope.getPreviewUrl(newVal)).load(
            function() {
              $scope.imageWidth = this.width;
              $scope.imageHeight = this.height;
              $scope.$apply();
            }
          );
        });
        
        function convertCoordsToFraction(coords, dimensions) {
          return [coords[0] / dimensions[0], coords[1] / dimensions[1]];
        }

        $scope.onSvgMouseMove = function(evt) {
          var svgElement = $($element).find('.oppia-image-with-regions-editor-svg');
          $scope.mouseX = evt.pageX - svgElement.offset().left;
          $scope.mouseY = evt.pageY - svgElement.offset().top;
          $scope.rectX = Math.min($scope.origX, $scope.mouseX);
          $scope.rectY = Math.min($scope.origY, $scope.mouseY);
          $scope.rectWidth = Math.abs($scope.origX - $scope.mouseX);
          $scope.rectHeight = Math.abs($scope.origY - $scope.mouseY);
        };
        $scope.onSvgMouseDown = function(evt) {
          evt.preventDefault();
          $scope.origX = $scope.mouseX;
          $scope.origY = $scope.mouseY;
          $scope.rectWidth = $scope.rectHeight = 0;
          $scope.userIsCurrentlyDragging = true;
        }
        $scope.onSvgMouseUp = function(evt) {
          $scope.userIsCurrentlyDragging = false;
          if ($scope.rectWidth != 0 && $scope.rectHeight != 0) {
            $scope.$parent.value.imageRegions.push({
              label: $scope.$parent.value.imageRegions.length.toString(),
              region: {
                regionType: 'Rectangle', 
                regionArea: [
                  convertCoordsToFraction(
                    [$scope.rectX, $scope.rectY], 
                    [$scope.imageWidth, $scope.imageHeight]
                  ),
                  convertCoordsToFraction(
                    [$scope.rectX + $scope.rectWidth, $scope.rectY + $scope.rectHeight],
                    [$scope.imageHeight, $scope.imageHeight]
                  )
                ]
              }
            });
          }
        };

        $scope.resetEditor = function() {
          $scope.$parent.value.imagePath = '';
          $scope.$parent.value.imageRegions = [];
        };
        $scope.deleteRegion = function(index) {
          $scope.$parent.value.imageRegions.splice(index, 1);
        };
      }
    };
  }
]);

