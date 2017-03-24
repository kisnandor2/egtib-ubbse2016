var app = angular.module('myApp', []);

app.controller('animatableVoronoiController', function($scope, $rootScope) {
	initVoronoi();
	initAlertBoxes();
	initWebSocket();

	function initVoronoi(){
		$scope.voronoi = new BaseVoronoi();

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
		voronoi.setSites(voronoi.generateBeeHivePoints(new paper.Size(Math.floor(Math.sqrt($scope.defaultCellCount)), Math.ceil(Math.sqrt($scope.defaultCellCount))), true));

		//CoopCost
		$scope.defaultCoopCost = 0.1;
		voronoi.setCoop_Cost($scope.defaultCoopCost);

		//Makes voronoi visible for highChartsController to set the voronoi chart
		$rootScope.voronoi = voronoi;
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
});

app.controller('parameterController', function($scope, $timeout) {
	$scope.successMessageDiv = $('#successMessage')[0];
	$scope.$watch('totalNumberOfCells', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value <2 || value > 500;
		}, function(){
			$scope.voronoi.setTotalNumberOfCells(newVal);
		})
	})
	$scope.$watch('percentOfDefectingCells', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > 100;
		}, function(value){
			$scope.voronoi.setPercentOfDefectingCells(newVal);
		})
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
			for (let i = 0; i < $scope.successMessageDiv.childNodes.length; ++i)
			$('.close')[i].click();
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
});

app.controller('simulationController', function($scope, $rootScope){

	$scope.addHighChartsWithData = function(i, {numberProductive, numberNonProductive, categories}){
		let name = 'highChartsContainer' + i;
		let chart = Highcharts.chart(name, {
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
				color: '#f36205',
				data: [],
			}, {
				name: 'Non-productive',
				color: '#2f98da',
				data: [],
			}, {
				name: 'NS',
				type: 'spline',
				color: '#000000',
				data: [],
			}]
		});
		chart.series[0].setData(numberProductive);
		chart.series[1].setData(numberNonProductive);
		chart.series[2].setData(numberNonProductive);
		chart.xAxis[0].setCategories(categories);
	}

	$scope.simulate = function(){
		message = JSON.stringify({
				bbox: $scope.voronoi.getBbox(),
				sites: $scope.voronoi.getSites(),
				gen_count: $scope.voronoi.getGen_Count(),
				coop_cost: $scope.voronoi.getCoop_Cost(),
				dist: $scope.voronoi.getDist(),
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
				let data = $scope.voronoi.getSimulationResults(sitesList);
				$scope.addHighChartsWithData(0, data);
				$("body").removeClass("loading");
			};
		}
	}
});
