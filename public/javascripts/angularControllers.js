var v;

var app = angular.module('myApp', []);

app.controller('animatableVoronoiController', function($scope) {
	initVoronoi();
	initAlertBoxes();
	initWebSocket();

	//TODO: Get this out of here?!!!!!
	//DEBUGGING WITH THIS
	v = $scope.voronoi;

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
		$scope.defaultGenerationCount = 1;
		voronoi.setGen_Count($scope.defaultGenerationCount);

		//Number of non_productive cells
		$scope.defaultNonProductiveCellCount = 50;
		voronoi.setPercentOfDefectingCells($scope.defaultNonProductiveCellCount);

		//CellCount
		$scope.defaultCellCount = 16;
		voronoi.setTotalNumberOfCells($scope.defaultCellCount);
		voronoi.setSites(voronoi.generateBeeHivePoints(new Size(Math.floor(Math.sqrt($scope.defaultCellCount)), Math.ceil(Math.sqrt($scope.defaultCellCount))), true));

		//CoopCost
		$scope.defaultCoopCost = 0.1;
		voronoi.setCoop_Cost($scope.defaultCoopCost);

		voronoi.renderDiagram();
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
		$('#startSimulation')[0].disabled = false;
	}

});

app.controller('simulationController', function($scope){

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
        // $scope.voronoi.resetChart(chart);
        $("body").removeClass("loading")
        // render(0, sitesList.length, sitesList);
      };
    }
	}

});

app.controller('highChartsController', function($scope){
	initHighCharts();

	function initHighCharts(){
		$scope.chart = Highcharts.chart('highChartsContainer', {
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
		$scope.chart.series[0].setData(numberProductive);
		$scope.chart.series[1].setData(numberNonProductive);
		$scope.chart.series[2].setData(numberNonProductive);
		$scope.chart.xAxis[0].setCategories(categories);
	}
})