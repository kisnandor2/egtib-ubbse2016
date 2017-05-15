var voronoiAccessibleFromOutside;

var app = angular.module('myApp', []);

app.controller('animatableVoronoiController', function($scope, $rootScope) {
	initVoronoi();
	initAlertBoxes();
	initWebSocket();
	initDefaultWatchIfNotSupported();

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
		$scope.defaultDistanceOfInteraction = 1;
		voronoi.setDist($scope.defaultDistanceOfInteraction);

		//GenerationCount
		$scope.defaultGenerationCount = 10;
		voronoi.setGen_Count($scope.defaultGenerationCount);

		//Number of non_productive cells
		$scope.defaultNonProductiveCellCount = 2;
		voronoi.setPercentOfDefectingCells($scope.defaultNonProductiveCellCount);

		//CellCount
		$scope.defaultCellCount = 16;
		voronoi.setTotalNumberOfCells($scope.defaultCellCount);
		voronoi.setSites(voronoi.generateBeeHivePoints(new Size(Math.floor(Math.sqrt($scope.defaultCellCount)), Math.ceil(Math.sqrt($scope.defaultCellCount))), true));

		//CoopCost
		$scope.defaultCoopCost = 0.1;
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
		try {
			let HOST = location.origin.replace(/^http/, 'ws');
			$scope.connection = new WebSocket(HOST);
		}
		catch (err) {
			try {
				$scope.connection = new WebSocket("localhost:3001");
			}
			catch (err) {
				alert("The Server is not working!");
				return;
			}
		}

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

});

app.controller('parameterController', function($scope, $timeout) {
	$scope.successMessageDiv = $('#successMessage')[0];
	$scope.$watch('totalNumberOfCells', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value <2 || value > 500;
		}, function(){
			$scope.voronoi.setTotalNumberOfCells(newVal);
		})
		$('#startSimulation')[0].disabled = true;
	})
	$scope.$watch('percentOfDefectingCells', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > 100;
		}, function(value){
			$scope.voronoi.setPercentOfDefectingCells(newVal);
		})
		$('#startSimulation')[0].disabled = true;
	})
	$scope.$watch('generationCount', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value <= 0;
		}, function(){
			$scope.voronoi.setGen_Count(newVal);
		})
	})
	$scope.$watch('cooperatingCost', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > 1;
		}, function(){
			$scope.voronoi.setCoop_Cost(newVal);
		})
	})
	$scope.$watch('distanceOfInteraction', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > 5;
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
	}

});

app.controller('simulationController', function($scope, $rootScope){

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
				$scope.voronoi.renderChartData(sitesList);
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

app.controller('highChartsController', function($rootScope){
	initHighCharts();

	function initHighCharts(){
		let colorProvider = new ColorProvider();
		var chart = Highcharts.chart('highChartsContainer', {
			chart: {type: 'column'},
			title: {text: 'Number of cells, over time'},
			xAxis: {categories: []},
			yAxis: {
				allowDecimals: false,
				min: 0,
				title: {text: 'Number of cells'}
			},
			tooltip: {
				formatter: function() {
					return '<b>' + this.x + '</b><br/>' +
						this.series.name + ': ' + this.y + '<br/>' +
						'Total: ' + this.point.stackTotal;
				}
			},
			plotOptions: {column: {stacking: 'normal'}},
			series: [{
				name: 'Productive',
				color: colorProvider.getRGBColor('c').toHex(),
				data: [],
			}, {
				name: 'Non-productive',
				color: colorProvider.getRGBColor('d').toHex(),
				data: [],
			}, {
				name: 'Separator',
				type: 'spline',
				color: '#000000',
			}]
		});

		let n = Math.ceil(Math.random() * 100);
		let categories = [];
		let numberProductive = [];
		let numberNonProductive = [];
		for (i = 0; i < 10; i++) {
			var p = Math.ceil(Math.random() * n); //ezt kell megkapjam
			numberProductive.push(p);
			numberNonProductive.push(n - p);
			categories.push(i + 1);
		}
		chart.series[0].setData(numberProductive);
		chart.series[1].setData(numberNonProductive);
		chart.series[2].setData(numberNonProductive);
		chart.xAxis[0].setCategories(categories);
		$rootScope.voronoi.setChart(chart);
	}
})

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