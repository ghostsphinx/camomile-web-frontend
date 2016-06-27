/**
 * Created by isc on 12/05/15.
 */



angular.module('myApp.controllers')
	.controller('EvidenceCtrl', ['$document', '$sce', '$scope', '$http',
		'defaults', '$controller', 'Session', '$rootScope', 'camomileService',

		function ($document, $sce, $scope, $http, defaults, $controller, Session, $rootScope, camomileService) {

			/*import MissPlete from './MissPlete.js';

        	new MissPlete({
            	input: document.querySelector('input[name="entry_input"]'),

            	options: [["Barcelona", "BCN"], ["San Francisco", "SF"]]
        	});*/

			$controller('CommonCtrl', {
				$scope: $scope,
				$http: $http,
				defaults: defaults,
				Session: Session
			});

			$scope.model.incomingQueue = $rootScope.queues.evidenceIn;
			$scope.model.outgoingQueue = $rootScope.queues.evidenceOut;

			$scope.model.q = {};

			$scope.model.user_input = {};
			//$scope.model.user_input.boundingBox = {};

			/*$scope.model.resetTransparentPlan = function () {
				var transparentPlan = d3.select("#transparent-plan");
				transparentPlan.selectAll("svg").remove();
				$scope.model.user_input.boundingBox = {};
			};*/

			$scope.model.updateIsDisplayedVideo = function (activate) {
				$scope.model.isDisplayedVideo = activate;
			};

			// initialize page state
			$scope.model.updateIsDisplayedVideo(false);
			//$scope.model.updateTransparentPlan = false;

			var _getVideo = function (id_medium, callback) {

				if ($scope.model.useDefaultVideoPath) {
					callback(null, $sce.trustAsResourceUrl(camomileService.getMediumURL(id_medium, 'webm')));
				} else {
					camomileService.getMedium(id_medium, function (err, medium) {
						callback(err, $sce.trustAsResourceUrl($scope.model.videoPath + '/' + medium.url + '.mp4'));
					});
				}
			};

			// Initializes the data from the queue
			// rename from "initQueueData" to "popQueueElement"
			$scope.model.popQueueElement = function () {

				// Get queue first element and pop it from the queue
				camomileService.dequeue($scope.model.incomingQueue, function (err, item) {


					if (err) {
						alert(item.error);
						$scope.$apply(function () {
							$scope.model.video = undefined;
							$scope.model.isDisplayedVideo = false;
							$scope.model.updateIsDisplayedVideo(false);
						});

						return;
					}

					//$scope.model.resetTransparentPlan();
					$scope.model.updateIsDisplayedVideo(true);

					if (item.source === "audio") {
						alert("Audio evidence");
					}

					$scope.model.q = item;
					$scope.model.user_input.person_name = $scope.model.q.person_name;
					$scope.model.initialData = $scope.model.q.person_name;

					// Update the add entry button's status
					$scope.model.updateIsDisplayedVideo($scope.model.user_input.person_name != "");

					async.parallel({
							video: function (callback) {
								_getVideo($scope.model.q.id_medium, callback);
							},
							serverDate: function (callback) {
								camomileService.getDate(function (err, data) {
									callback(null, data.date);
								});
							}
						},
						function (err, results) {
							$scope.model.video = results.video;
							$scope.model.serverDate = results.serverDate;
							$scope.model.clientDate = Date.now();

							$scope.model.restrict_toggle = 2;
							/*$scope.model.current_time_temp = $scope.model.q.start;
							$scope.model.infbndsec = parseFloat($scope.model.q.start || 0);
							if ($scope.model.infbndsec < 0) {
								$scope.model.infbndsec = 0;
							}
							$scope.model.supbndsec = parseFloat($scope.model.q.end || 0);
							if ($scope.model.supbndsec > $scope.model.fullDuration) {
								$scope.model.supbndsec = $scope.model.fullDuration;
							}
							$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;

							$scope.$apply(function () {
								$scope.model.current_time = $scope.model.q.start;
							});*/
							$scope.model.current_time_temp = $scope.model.q.timestamp;
							$scope.model.infbndsec = parseFloat($scope.model.q.timestamp || 0);
							$scope.model.infbndsec-=5.0;
							if ($scope.model.infbndsec < 0) {
								$scope.model.infbndsec = 0;
							}
							$scope.model.supbndsec = parseFloat($scope.model.q.timestamp || 0);
							$scope.model.supbndsec+=5.0;
							if ($scope.model.supbndsec > $scope.model.fullDuration) {
								$scope.model.supbndsec = $scope.model.fullDuration;
							}
							$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;

							$scope.$apply(function () {
								$scope.model.current_time = $scope.model.q.timestamp;
							});

						});
				});
			};

			// Event launched when click on the save button.
			$scope.model.saveQueueElement = function (isEvidence) {

				if (isEvidence && document.getElementById('evidence').src === "") /*($scope.model.user_input.boundingBox.w === undefined || $scope.model.user_input.boundingBox.w === 0))kk*/ {
					alert("Please draw a bounding box around the face.");
					return;
				}

				var item = {};

				item.log = {};
				item.log.user = Session.username;
				item.log.date = $scope.model.serverDate;
				item.log.duration = Date.now() - $scope.model.clientDate;

				item.input = {};
				item.input.id_submission = $scope.model.q.id_submission;
				item.input.person_name = $scope.model.initialData;
				item.input.source = $scope.model.q.source;
				item.input.id_medium = $scope.model.q.id_medium;
				item.input.id_shot = $scope.model.q.id_shot;
				/*item.input.start = $scope.model.q.start;
				item.input.end = $scope.model.q.end;*/
				item.input.timestamp = $scope.model.q.timestamp;

				var b_box = {};
				b_box.w = document.getElementById("Wbox").value;
				b_box.h = document.getElementById("Hbox").value;
				b_box.x = document.getElementById("Xbox").value;
				b_box.y = document.getElementById("Ybox").value;

				item.output = {};
				item.output.is_evidence = isEvidence;
				if (isEvidence) {
					item.output.person_name = $scope.model.user_input.person_name;
					item.output.time = $scope.model.current_time;
					item.output.image = document.getElementById('evidence').src;//$scope.model.user_input.boundingBox;
					item.output.bounding_box = b_box;
				}

				document.getElementById('evidence').src = "";

				camomileService.enqueue($scope.model.outgoingQueue, item, function (err, data) {

					if (err) {
						console.log("Something went wrong");
					} else {
						$scope.model.popQueueElement();
					}

				});
			};

			/*var liste = [];
			var listeA = camomileService.getAnnotations();
			var annot;
			var i=0;
			for (;i<listeA;i++){
				annot = listeA[i];
				if(annot.data.output.person_name != "") liste.push(annot.data.output.person_name);
			}*/
			/*$('#entry_input').autocomplete({
				source : liste
			});*/



			/*var player = $("#player");
			var transparentPlan = d3.select("#transparent-plan").style("width", "100%")
				.style("height", (player.height()) + "px");

			var originPosition;
			transparentPlan.on("mouseup", function () {
				originPosition = undefined;
			});

			var drag = d3.behavior.drag()
				.origin(Object)
				.on("drag", function () {

					// mouse position
					var mouse = d3.mouse(this);

					originPosition = originPosition ? originPosition : mouse;
					// Remove old element
					transparentPlan.selectAll("svg").remove();

					var size = Math.abs(mouse[0] - originPosition[0]);
					var x = originPosition[0] - size;
					var y = originPosition[1] - size;
					var width = 2 * size;
					var height = 2 * size;

					transparentPlan.append("svg")
						.style("width", "100%")
						.style("height", "100%")
						.append("rect")
						.attr("x", x)
						.attr("y", y)
						.attr("width", width)
						.attr("height", height)
						.style("fill", "none")
						.style("stroke", "red")
						.style("stroke-width", 5);

					// Store bounding box;
					$scope.model.user_input.boundingBox.w = width / player.width();
					$scope.model.user_input.boundingBox.h = height / player.height();
					$scope.model.user_input.boundingBox.x = x / player.width();
					$scope.model.user_input.boundingBox.y = y / player.height();

				});

			transparentPlan.call(drag);*/

			$document.on(
				"keydown",
				function (event) {
					var targetID = event.target.id;
					var button_checked = false;
					if (targetID == 'confirm' || targetID == 'cancel') {
						button_checked = true;
					}
					//enter
					if (event.keyCode == 13 && targetID != 'localServerInput') {
						//If the focus is on the check buttons, blur the focus first
						if (button_checked) {
							event.target.blur();
						}
						$scope.$apply(function () {
							$scope.model.saveQueueElement(true);
						});
					}
					//space
					if (event.keyCode == 32 && targetID != "entry_input") {
						if (button_checked) {
							event.target.blur();
						}
						$scope.$apply(function () {
							$scope.model.toggle_play();
						});
					}
					//esc-> skip
					if (event.keyCode == 27) {
						$scope.$apply(function () {
							//skip
							$scope.model.saveQueueElement(false);
						});
					}
					//Left
					if (event.keyCode == 37) {
						$scope.$apply(function () {
							if ($scope.model.current_time - 0.04 > $scope.model.infbndsec) {
								$scope.model.current_time = $scope.model.current_time - 0.04;
							} else {
								$scope.model.current_time = $scope.model.infbndsec;
							}
						});
					}
					//Right
					if (event.keyCode == 39) {
						$scope.$apply(function () {
							if ($scope.model.current_time + 0.04 < $scope.model.supbndsec) {
								$scope.model.current_time = $scope.model.current_time + 0.04;
							} else {
								$scope.model.current_time = $scope.model.supbndsec;
							}
						});
					}
					//Up
					if (event.keyCode == 38) {
						$scope.$apply(function () {
							if ($scope.model.current_time - 1 > $scope.model.infbndsec) {
								$scope.model.current_time = $scope.model.current_time - 1;
							} else {
								$scope.model.current_time = $scope.model.infbndsec;
							}
						});

					} //Down
					if (event.keyCode == 40) {
						$scope.$apply(function () {

							if ($scope.model.current_time + 1 < $scope.model.supbndsec) {
								$scope.model.current_time = $scope.model.current_time + 1;
							} else {
								$scope.model.current_time = $scope.model.supbndsec;
							}
						});
					}
				}
			);

		}
	]);

angular.module('myApp.controllers').directive('drawing', function(){
  return {
    restrict: 'E',
    scope: { localRectangles: '=rectangleList' },
    template: '<canvas class="drawing"></canvas>',
    link: function(scope, element){
    	// There are 3 canvas, one used to determine the zone to copy
    	// another one to extract the image and clip it, the last one to resize the image
      var canvasElement = element.children()[0];
      var ctx = canvasElement.getContext('2d');
      var canvasB = document.getElementById("recup");
      var ctxb = canvasB.getContext('2d');
      var canvasE = document.getElementById("evid");
      var ctxe = canvasE.getContext('2d');

      // The first canvas can be sized at the beginning
      canvasElement.width = document.getElementById("video-container").offsetWidth;
      canvasElement.height = document.getElementById("video-container").offsetHeight;
      

      // Are we drawing?
      var drawing = false;
      
      // the last coordinates before the current move
      var centerX;
      var centerY;

      element.bind('mousedown', function(event){  
        reset();
        startX = event.offsetX;
        startY = event.offsetY;
        
        // begins new line
        ctx.beginPath();
        
        drawing = true;
      });

      element.bind('mousemove', function(event){
        
        if(drawing){
        
        //document.getElementById('evid').style.display = "none";
        document.getElementById('evidence').style.display = "none";

          // get current mouse position
          currentX = event.offsetX;
          currentY = event.offsetY;

          // get the opposite corner position of the rectangle
          oppositeX = 2*startX-currentX;
          oppositeY = 2*startY-currentY;

          // limit all the rectangle within the canvas and draw
          if(oppositeX >= 0 && oppositeX <= 360*document.getElementById('player').videoWidth/document.getElementById('player').videoHeight && oppositeY >= 0 && oppositeY <= 360
          		&& currentX >= 0 && currentX <= 360*document.getElementById('player').videoWidth/document.getElementById('player').videoHeight && currentY >= 0 && currentY <= 360){
            draw(startX, startY, currentX, currentY);

          }
        }
        
      });

      // canvas reset
      function reset(){
      	// This simple operation reset the canvas
       canvasElement.width = canvasElement.width;
       canvasB.width = canvasB.width;
      }

      element.bind('mouseup', function(event){
        // stop drawing
        drawing = false;
        //document.getElementById('evid').style.display = "";
        document.getElementById('evidence').style.display = "";
      });
      
      function draw(centerX, centerY,
                    currentX, currentY, rotate){
        
        reset();
        var sizeX = 2 * (currentX - centerX);
        var sizeY = 2 * (currentY - centerY);
        var oppositeX = 2*startX-currentX;
        var oppositeY = 2*startY-currentY;
       
        ctx.rect(Math.min(oppositeX,currentX),
                 Math.min(oppositeY,currentY),
                 Math.abs(sizeX), Math.abs(sizeY));
        ctx.lineWidth = 3;
        // color gradient
        var gradient=ctx.createLinearGradient(Math.min(oppositeX,currentX),Math.min(oppositeY,currentY),Math.max(oppositeX,currentX),Math.max(oppositeY,currentY));
        gradient.addColorStop("0.05","red");
        gradient.addColorStop("0.15","blue");
        gradient.addColorStop("0.25","red");
        gradient.addColorStop("0.35","blue");
        gradient.addColorStop("0.45","red");
        gradient.addColorStop("0.55","blue");
        gradient.addColorStop("0.65","red");
        gradient.addColorStop("0.75","blue");
        gradient.addColorStop("0.85","red");
        gradient.addColorStop("0.95","blue");
        ctx.strokeStyle = gradient;
        // color
        //ctx.strokeStyle = 'red';
        // draw it
        ctx.stroke();
        // Launch the copy process
        copy(Math.min(oppositeX,currentX),Math.min(oppositeY,currentY),Math.abs(currentX-oppositeX),Math.abs(currentY-oppositeY));
        document.getElementById("Xbox").value = Math.min(oppositeX,currentX)/(360*document.getElementById('player').videoWidth/document.getElementById('player').videoHeight);
        document.getElementById("Ybox").value = Math.min(oppositeY,currentY)/360;
        document.getElementById("Wbox").value = Math.abs(currentX-oppositeX)/(360*document.getElementById('player').videoWidth/document.getElementById('player').videoHeight);
        document.getElementById("Hbox").value = Math.abs(currentY-oppositeY)/360;
      }

      function copy(X, Y, sizeX, sizeY){

      	// Get the video source and size the second canvas according to the dimension (16:9 or 4:3)
        var src = document.getElementById('player');
        canvasB.width = 360*src.videoWidth/src.videoHeight;
        canvasB.height = 360;
        // Copy the image
        ctxb.drawImage(src,0,0,canvasB.width,canvasB.height);
        // Clip the image
        var btmp = ctxb.getImageData(X, Y, sizeX, sizeY);
        // Clear the second canvas to put the part of the image we want
        ctxb.clearRect(0,0,canvasB.width,canvasB.height);
        ctxb.putImageData(btmp,0,0);
        // Size of the last canvas
        canvasE.width = sizeX;
        canvasE.height = sizeY;
        // Copy from the second canvas to the third
        ctxe.putImageData(btmp,0,0);
        // Enlarge or reduce image with fixed dimensions
        //canvasE.style.width = 100 + "px";
    	//canvasE.style.height = 100 + "px";
    	//dataURI JPEG output
    	document.getElementById('evidence').src = canvasE.toDataURL("image/jpeg", 1.0);

      }

    }
  };
});