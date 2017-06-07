
var voronoiAccessibleFromOutside;
var voronoiAccessibleFromOutside2 = {};

var app = angular.module('myApp', ['commonApp']);

app.constant('defaults', {
	distance : 1,
	generation: 10,
	nonProductive: 10,
	cellCount: 81,
	coopCost: 0.1
});

app.constant('boundary', {
    maxNumberOfCells: 500,
    maxPercentOfDefectingCells: 100,
	minGenerationCount: 0,
    minCooperatingCost: 0,
	maxCooperatingCost: 1,
	maxDistanceOfInteraction: 5

})
app.controller('animatableVoronoiController', function($scope, $rootScope, defaults) {
	initVoronoi();
	initAlertBoxes();
	initWebSocket();
	initDefaultWatchIfNotSupported();
	initChartData();
	//TODO: look for a better way to wait for CSS animation(this is a workaround);
	voronoiAccessibleFromOutside = $scope.voronoi;


	function initVoronoi(){
		let canvas = $('#canvas')[0];
		let context = canvas.getContext('2d');
		paper.install(window);
		paper.setup(canvas);
		$scope.voronoi = new AnimatableVoronoi(view, context);

		var voronoi = $scope.voronoi;

		//Distance of interaction
		$scope.defaultDistanceOfInteraction = defaults.distance;
		voronoi.setDist($scope.defaultDistanceOfInteraction);

		//GenerationCount
		$scope.defaultGenerationCount = defaults.generation;
		voronoi.setGen_Count($scope.defaultGenerationCount);

		//Number of non_productive cells
		$scope.defaultNonProductiveCellCount = defaults.nonProductive;
		voronoi.setPercentOfDefectingCells($scope.defaultNonProductiveCellCount);

		//CellCount
		$scope.defaultCellCount = defaults.cellCount;
		voronoi.setTotalNumberOfCells($scope.defaultCellCount);
		voronoi.setSites(voronoi.generateBeeHivePoints(new Size(Math.floor(Math.sqrt($scope.defaultCellCount)), Math.ceil(Math.sqrt($scope.defaultCellCount))), true));

		//CoopCost
		$scope.defaultCoopCost = defaults.coopCost;
		voronoi.setCoop_Cost($scope.defaultCoopCost);

		voronoi.renderDiagram();

		//Makes voronoi visible for highChartsController to set the voronoi chart
		$rootScope.voronoi = voronoi;
		$(window).resize(voronoi.onResize);
	}
	function initAlertBoxes(){
		$scope.successMessage = $('<div />', {
			"class": 'alert alert-success alert-dismissable fade in',
			text: "Parameter set"
		});
		$scope.dangerMessage = $('<div />', {
			"class": 'alert alert-danger alert-dismissable fade in',
			text: "Incorrect value"
		});
		let successMessageX1 = $('<a />', {
			"class": 'close',
			"href": "#",
			"data-dismiss": "alert",
			"aria-label": "close",
			"text": "×"
		});
		let successMessageX2 = $('<a />', {
			"class": 'close',
			"href": "#",
			"data-dismiss": "alert",
			"aria-label": "close",
			"text": "×"
		});
		$scope.dangerMessage = $scope.dangerMessage[0];
		$scope.successMessage = $scope.successMessage[0];
		$scope.successMessage.appendChild(successMessageX1[0]);
		$scope.dangerMessage.appendChild(successMessageX2[0]);
	}
	function initWebSocket(){
		let HOST = location.origin.replace(/^http/, 'ws');
		$scope.connection = new WebSocket(HOST);
		$scope.connection.addEventListener("error", e => {
      if (e.target.readyState === 3) {
      	$scope.connection = new WebSocket("ws://localhost:3001");
      }
    });

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		async function heartbeat() {
				while (true) {
						if ($scope.connection.readyState == 1) {
								$scope.connection.send(JSON.stringify({ heartbeat: 'heartbeat' }));
								await sleep(30000);
						} else {
								await sleep(100);
						}
				}
		}
		setTimeout(function() {
			heartbeat();
		}, 1000)
	}
	function initDefaultWatchIfNotSupported(){
		if (!Object.prototype.watch) {
				Object.defineProperty(Object.prototype, "watch", {
							enumerable: false
						, configurable: true
						, writable: false
						, value: function (prop, handler) {
								var
									oldVal = this[prop]
								, newVal = oldVal
								, getter = function () {
										return newVal;
								}
								, setter = function (val) {
										oldVal = newVal;
										return newVal = handler.call(this, prop, oldVal, val);
								}
								;

								if (delete this[prop]) { // can't watch constants
										Object.defineProperty(this, prop, {
													get: getter
												, set: setter
												, enumerable: true
												, configurable: true
										});
								}
						}
				});
		}

		// object.unwatch
		if (!Object.prototype.unwatch) {
				Object.defineProperty(Object.prototype, "unwatch", {
							enumerable: false
						, configurable: true
						, writable: false
						, value: function (prop) {
								var val = this[prop];
								delete this[prop]; // remove accessors
								this[prop] = val;
						}
				});
		}
	}

 	function initChartData(){
        let colorProvider = new ColorProvider();
        $scope.chartData = [{
            name: 'Productive',
            color: colorProvider.getRGBColor('c').toHex(),
            data: Array.apply(null, Array(10)).map(function(item, index){
                return Math.floor(Math.random() * 9);
            })
        }, {
            name: 'Non-nonProductive',
            color: colorProvider.getRGBColor('d').toHex(),
            data: Array.apply(null, Array(10)).map(function(item, index){
                return Math.floor(Math.random() * 9);
            })
        }, {
            name: 'Separator',
            type: 'spline',
            color: '#000000'
        }]
	}

	function setChartData(siteList) {
 		var productive = []
		var nonProductive = []
        $scope.chartData[0].data = []
        $scope.chartData[1].data = []
 		for (var i =0; i<siteList.length; ++i){
 			var p = $scope.voronoi.getProductiveCount(siteList[i])
			var n = siteList[i].length
			productive.push(p)
			nonProductive.push(n-p)
		}
		$scope.chartData[0].data = productive
		$scope.chartData[1].data = nonProductive
		$scope.chartData[2].data = nonProductive
		$scope.$apply() // necessary for the "digest cycle" to detect changes!

    }

    $scope.simulate = function(){
        message = JSON.stringify({
            bbox: $scope.voronoi.getBbox(),
            sites: $scope.voronoi.getSites(),
            gen_count: $scope.voronoi.getGen_Count(),
            coop_cost: $scope.voronoi.getCoop_Cost(),
            dist: $scope.voronoi.getDist(),
            itShouldDivide: $("#itShouldDivide")[0].checked
            //send more data here
        });
        $scope.connection.send(message);
        $scope.connection.onmessage = function(e) {
            //If the websocket processed the information simulate on the server side
            $.get("voronoi/data", function(data, textStatus, response){
                if (response.responseText != 'ok'){
                    alert('error');
                }
            });
            $("body").addClass("loading");
            $scope.connection.onmessage = function(e) {
                //Get results via the websocket
                sitesList = JSON.parse(e.data);
                for (let i = 0; i < sitesList.length; ++i){
                    sitesList[i] = $scope.voronoi.sitesBadFormatToPointFormat(sitesList[i]);
                }
                $("body").removeClass("loading");
                setChartData(sitesList)
                $scope.voronoi.setSitesList(sitesList);
                turnOffProgressBarClickAndHoverAndMouseMove();
                $('#startSimulation')[0].style.display = 'none';
                $('#pauseSimulation')[0].style.display = 'block';
                $('#renderNewDiagram')[0].disabled = true;
                $scope.voronoi.toBeRendered = 0;
                $scope.voronoi.render();
            };
        }
    }

    $scope.pause = function(){
        $('#renderNewDiagram')[0].disabled = false;
        $('#pauseSimulation')[0].style.display = 'none';
        $('#resumeSimulation')[0].style.display = 'block';
        $scope.voronoi.toBeRendered = -9999;
        turnOnProgressBarClickAndHoverAndMouseMove();
    }

    $scope.resume = function(){
        turnOffProgressBarClickAndHoverAndMouseMove();
        $('#renderNewDiagram')[0].disabled = true;
        $('#pauseSimulation')[0].style.display = 'block';
        $('#resumeSimulation')[0].style.display = 'none';
        $scope.voronoi.toBeRendered = $scope.voronoi.savedToBeRendered; //progressBar.value
        $scope.voronoi.render();
    }

    //$scope.$watch did not work here, so this is some magic
    $scope.voronoi.watch('toBeRendered', function(property, oldVal, newVal){
        if (newVal >= this.gen_count){
            $('#resumeSimulation')[0].style.display = 'none';
            $('#pauseSimulation')[0].style.display = 'none';
            $('#startSimulation')[0].style.display = 'block';
            $('#renderNewDiagram')[0].disabled = false;
            turnOnProgressBarClickAndHoverAndMouseMove();

        }
        //It has to return the newVal
        //TODO: take this "feature" out from initDefaultWatchIfNotSupported
        return newVal;
    })

    function turnOffProgressBarClickAndHoverAndMouseMove(){
        $("#progress").unbind('click');
        $("#progress").unbind('mouseover');
        $("#progress").unbind('mouseenter');
        $("#progress").unbind('mouseleave');
        $("#progress").unbind('mousemove');
        $('#progressBar')[0].addEventListener('transitionend', $('#progressBar')[0].waitForCSSAnimation);
    }
    function turnOnProgressBarClickAndHoverAndMouseMove(){
        $("#progress").click($rootScope.progressBarOnClick);
        $("#progress").mousemove($rootScope.progressBarOnMousemove);
        $("#progress").hover($rootScope.progressBarOnHoverIn, $rootScope.progressBarOnMouseHoverOut);
        $('#progressBar')[0].removeEventListener('transitionend', $('#progressBar')[0].waitForCSSAnimation);
    }

});

app.controller('parameterController', function($scope, $timeout, boundary) {
	$scope.successMessageDiv = $('#successMessage')[0];
	$scope.$watch('totalNumberOfCells', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value <2 || value > boundary.maxNumberOfCells;
		}, function(){
			$scope.voronoi.setTotalNumberOfCells(newVal);
		})
		$('#startSimulation')[0].disabled = true;
	})
	$scope.$watch('percentOfDefectingCells', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > boundary.maxPercentOfDefectingCells;
		}, function(value){
			$scope.voronoi.setPercentOfDefectingCells(newVal);
		})
		$('#startSimulation')[0].disabled = true;
	})
	$scope.$watch('generationCount', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value <= boundary.minGenerationCount;
		}, function(){
			$scope.voronoi.setGen_Count(newVal);
		})
	})
	$scope.$watch('cooperatingCost', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < boundary.minCooperatingCost || value > boundary.maxCooperatingCost;
		}, function(){
			$scope.voronoi.setCoop_Cost(newVal);
		})
	})
	$scope.$watch('distanceOfInteraction', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > boundary.maxDistanceOfInteraction;
		}, function(){
			$scope.voronoi.setDist(newVal);
		})
	})

	function showAlerts(newVal, oldVal, condition, execute){
		try{
			for (let i = 0; i < $scope.successMessageDiv.childNodes.length; ++i){
				$('.close')[i].click();
			}
		}
		catch(error){}
		if (newVal == undefined)
			return;
		else if (condition(newVal)){
			var dangerMessage = [];
			angular.copy([$scope.dangerMessage], dangerMessage);
			$scope.successMessageDiv.appendChild(dangerMessage[0]);
		}
		else if (newVal != oldVal){
			execute();
			var successMessage = [];
			angular.copy([$scope.successMessage], successMessage);
			$scope.successMessageDiv.appendChild(successMessage[0]);
		}
		//TODO: maybe implement a list to check if needs to be closed
		$timeout(function(){
			try{
				$('.close')[0].click();
			}
			catch(error){}
		}, 1500)
	}

	$scope.renderNewDiagram = function(){


		$scope.voronoi.setSites($scope.voronoi.generateBeeHivePoints(new Size(Math.floor(Math.sqrt($scope.voronoi.totalNumberOfCells)), Math.ceil(Math.sqrt($scope.voronoi.totalNumberOfCells))), true));
		$scope.voronoi.renderDiagram();
		$scope.voronoi.progressBar.style.width = '0%';
		$('#progressText')[0].textContent = '0%';
		$('#resumeSimulation')[0].style.display = 'none';
		$('#pauseSimulation')[0].style.display = 'none';
		$('#startSimulation')[0].style.display = 'block';
		$('#startSimulation')[0].disabled = false;
		voronoiAccessibleFromOutside2 = JSON.stringify({ //testing
				bbox: $scope.voronoi.getBbox(),
				sites: $scope.voronoi.getSites(),
				gen_count: $scope.voronoi.getGen_Count(),
				coop_cost: $scope.voronoi.getCoop_Cost(),
				dist: $scope.voronoi.getDist(),
				itShouldDivide: $("#itShouldDivide")[0].checked
				//send more data here
		});
	}

});


app.controller('progressBarController', function($rootScope){
	$rootScope.voronoi.setProgressBar($('#progressBar')[0]);
	$rootScope.progressBarOnClick = function progressBarOnClick(e){
		let clickedX = e.pageX - $(this).offset().left;
		let percent = clickedX/$("#progress")[0].clientWidth*100;
		let toBeRendered = Math.floor(percent*$rootScope.voronoi.gen_count/100)
		$rootScope.voronoi.savedToBeRendered = toBeRendered;
		if (toBeRendered != $rootScope.voronoi.getGen_Count())
			$rootScope.voronoi.sites = $rootScope.voronoi.sitesList[toBeRendered];
		$rootScope.voronoi.renderDiagram();
		$('#startSimulation')[0].style.display = 'none';
		$('#resumeSimulation')[0].style.display = 'block';
		p = $('#progressBar')[0];
		percent = Math.floor(percent) + '%';
		p.style.width = percent;
		p.savedProgressWidth = percent;
		$('#progressText')[0].textContent = percent;
		p.savedProgressText = percent;
	}
	$rootScope.progressBarOnMousemove = function progressBarOnMousemove(e){
		let clickedX = e.pageX - $(this).offset().left;
		let percent = clickedX/$("#progress")[0].clientWidth*100;
		let toBeRendered = Math.floor(percent*$rootScope.voronoi.gen_count/100)
		$('#progressBar')[0].style.width = percent + '%';
		$('#progressText')[0].textContent = toBeRendered + '/' + $rootScope.voronoi.gen_count;
	}
	$rootScope.progressBarOnHoverIn = function progressBarOnHoverIn(e){
		p = $('#progressBar')[0];
		p.savedProgressWidth = p.style.width;
		p.savedProgressText = $('#progressText')[0].textContent;
	}
	$rootScope.progressBarOnMouseHoverOut = function progressBarOnMouseHoverOut(e){
		p = $('#progressBar')[0];
		p.style.width = p.savedProgressWidth;
		$('#progressText')[0].textContent = p.savedProgressText;
	}

	function waitForCSSAnimation(){
		v = voronoiAccessibleFromOutside;
		v.recursiveRender(v.toBeRendered);
	}
	$('#progressBar')[0].waitForCSSAnimation = waitForCSSAnimation;

})