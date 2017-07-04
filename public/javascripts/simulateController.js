var voronoiAccessibleFromOutside;
var voronoiAccessibleFromOutside2;

var app = angular.module('myApp', ["chart.js"]);

app.controller('baseVoronoiController', function($scope, $rootScope) {
	initStatistics();
	initVoronoi();
	initAlertBoxes();
	initWebSocket();
	
	function initStatistics(){
		$rootScope.hideStatistics = true;
	}

	function initVoronoi(){
		$scope.voronoi = new BaseVoronoi();
		voronoiAccessibleFromOutside = $scope.voronoi;

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

        //Max valaue of benefit
        $scope.defaultCoopLimit = 0.5;

		//Makes voronoi visible for highChartsController to set the voronoi chart
		$rootScope.voronoi = voronoi;

        $scope.defaultSteepness = 4;
        $scope.defaultInflectionPoint = 0.5;
		$scope.defaultSteepness1 = 4;
		$scope.defaultInflectionPoint1 = 0.5;
        $scope.defaultSteepness2 = 4;
        $scope.defaultInflectionPoint2 = 0.5;
		$scope.defaultShapeOfDif = 0.5;
		$scope.defaultSteepnessOfGrad = 3;
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

//---------------------------------------------- charts with functions ---------------
	let x = Array.from(Array(100).keys());
  	y = []
  	const e = Math.exp(1);
  	const n = 6;
  	const maxDamage = 1;
  	x = x.map(function (data) { return data/100; })
  	$scope.labels = x;
  	$scope.payoffData = x.map(function (data) {
	    	return (V_def(data) - V_def(0))/(V_def(n) - V_def(0))
	});

	$scope.gradientData = x.map(function (data) {
	    	return (g_def(data) - g_def(0))/(g_def(n) - g_def(0))
	});

    $scope.l1Data = x.map(function (data) {
        return (l1_def(data) - l1_def(0))/(l1_def(n * $scope.defaultCoopLimit) - l1_def(0))
    });
    $scope.l2Data = x.map(function (data) {
        return 1- ((l2_def(data,maxDamage) - l2_def($scope.defaultCoopLimit * n, maxDamage))/(l2_def(n,1) - l2_def($scope.defaultCoopLimit * n,1)))
    });

	$scope.reloadPayoff = function () {
	  	$scope.payoffData = x.map(function (data) {
	    	return (V(data) - V(0))/(V(n) - V(0))
	      });
	};

	$scope.reloadGradient = function () {
	  	$scope.gradientData = x.map(function (data) {
	    	return (g(data) - g(0))/(g(n) - g(0))
	      });
	};
    $scope.reloadL1 = function () {
        $scope.l1Data = x.map(function (data) {
            return (l1(data) - l1(0))/(l1(n * $("#cooperatingLimit")[0].value) - l1(0))
        });
    };
    $scope.reloadL2 = function () {
        $scope.l2Data = x.map(function (data) {
            return 1- ((l2(data,maxDamage) - l2($("#cooperatingLimit")[0].value * n, maxDamage))/(l2(n,1) - l2($("#cooperatingLimit")[0].value * n,1)))
        });
    };

    function l1_def(j){
        return 1 / (1 + Math.pow(e, ($scope.defaultSteepness1 * ($scope.defaultInflectionPoint1 - ((j/n)/$scope.defaultCoopLimit)))));
    }

    function l2_def(j,y){
        return 1 / (1 + Math.pow(e, ($scope.defaultSteepness2* ($scope.defaultInflectionPoint2 - ((j/n - $scope.defaultCoopLimit)/(1-$scope.defaultCoopLimit))))));
    }

    function V_def(j){
		return 1 / (1 + Math.pow(e, ($scope.defaultSteepness * (j - $scope.defaultInflectionPoint)) / n));
	}
	function g_def(j){
		return 1 / (1 + Math.pow(e, ($scope.defaultSteepnessOfGrad * (j - $scope.defaultDistanceOfInteraction * $scope.defaultShapeOfDif)) / $scope.defaultDistanceOfInteraction));
	}
	function V(j){
		return 1 / (1 + Math.pow(e, ($("#steepness")[0].value * (j - $("#inflectionPoint")[0].value )) / n));
	}

	function g(j){
		return 1 / (1 + Math.pow(e, ($("#steepnessOfGrad")[0].value * (j - $("#distanceOfInteraction")[0].value * $("#shapeOfDif")[0].value)) / $("#distanceOfInteraction")[0].value));
	}
    function l1(j){
        return 1 / (1 + Math.pow(e, ($("#steepness1")[0].value * ($("#inflectionPoint1")[0].value - ((j/n)/$("#cooperatingLimit")[0].value)))));
    }

    function l2(j,y){
        return y / (1 + Math.pow(e, ($("#steepness2")[0].value * ($("#inflectionPoint2")[0].value - ((j/n - $("#cooperatingLimit")[0].value)/(1-$("#cooperatingLimit")[0].value))))));
    }
	$scope.options = {
	  	elements: { point: { radius: 0 } },
	    scales: {
	      xAxes: [{
	                display: false
	            }]
	    }
	};

});

app.controller('parameterController', function($scope, $timeout) {
	$scope.successMessageDiv = $('#successMessage')[0];
	$scope.$watch('totalNumberOfCells', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 2 || value > 2500;
		})
	})
	$scope.$watch('percentOfDefectingCells', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > 100;
		})
	})
	$scope.$watch('generationCount', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value <= 0;
		})
	})
	$scope.$watch('cooperatingCost', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > 1;
		})
	})
	$scope.$watch('distanceOfInteraction', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > 10;
		})
	})
	$scope.$watch('shapeOfDif', function(newVal, oldVal){
		showAlerts(newVal, oldVal, function(value){
			return value < 0 || value > 1;
		})
	})

	function showAlerts(newVal, oldVal, condition){
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
		let colorProvider = new ColorProvider();
		let name = 'highChartsContainer' + i;
		$('#panel').append('<div id="' + name + '"></div>');
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
				color: colorProvider.getRGBColor('c').toHex(),
				data: [],
			}, {
				name: 'Non-productive',
				color: colorProvider.getRGBColor('d').toHex(),
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

	$scope.showDangerAlert = function(){
		try{
			for (let i = 0; i < $scope.successMessageDiv.childNodes.length; ++i)
			$('.close')[i].click();
		}catch(error){}
		var dangerMessage = [];
		angular.copy([$scope.dangerMessage], dangerMessage);
		$scope.successMessageDiv.appendChild(dangerMessage[0]);
	}

	function parseInput(value){
		if (!isNaN(value))
			return value;
		let parsed = value.split(':');
		if (parsed.length != 3)
			throw "Incorrect input";
		let from = parsed[0];
		let to = parsed[2];
		let step = parsed[1];
		if (isNaN(from) || isNaN(to) || isNaN(step))
			throw "Incorrect input";
		return {
			from,
			to,
			step
		}
	}

	function getParameterValues(){
		let totalNumberOfCells = $('#totalNumberOfCells')[0].value;
		if (isNaN(totalNumberOfCells)){
			$scope.showDangerAlert();
			return;
		}
		let percentOfDefectingCells = $('#percentOfDefectingCells')[0].value;
		if (isNaN(percentOfDefectingCells)){
			$scope.showDangerAlert();
			return;
		}
		let generationCount = $('#generationCount')[0].value;
		if (isNaN(generationCount)){
			$scope.showDangerAlert();
			return;
		}
		let cooperatingCost;
		try{
			cooperatingCost = parseInput($('#cooperatingCost')[0].value);
		}
		catch (err){
			$scope.showDangerAlert();
			return;	
		}
		let distanceOfInteraction;
		try {
			distanceOfInteraction = parseInput($('#distanceOfInteraction')[0].value);
		}
		catch (err){
			$scope.showDangerAlert();
			return;
		}
		return {
			totalNumberOfCells,
			percentOfDefectingCells,
			generationCount,
			cooperatingCost,
			distanceOfInteraction
		}
	}

	function range({from, to, step}){
		if (to == undefined){
			return [arguments[0]];
		}
		let ret = [];
		from = parseFloat(from);
		to = parseFloat(to);
		step = parseFloat(step);
		if (to <= from){
			return from;
		}
		for (let i = from; i <= to; i+=step){
			ret.push(i);
		}
		return ret;
	}

	function getBaseVoronoiList(){
		let voronois = [];
		parameters = getParameterValues();
		if (parameters == undefined)
			return;
		generationCount = range(parameters.generationCount);
		cooperatingCost = range(parameters.cooperatingCost);
		distanceOfInteraction = range(parameters.distanceOfInteraction);
		$scope.voronoi.setTotalNumberOfCells(parameters.totalNumberOfCells);
		$scope.voronoi.setPercentOfDefectingCells(parameters.percentOfDefectingCells);
		$scope.voronoi.generateNewSites();
		let sites = $scope.voronoi.getSites();
		for (let i = 0; i < generationCount.length; ++i)
			for (let j = 0; j < cooperatingCost.length; ++j)
				for (let k = 0; k < distanceOfInteraction.length; ++k){
					let voronoi = new BaseVoronoi();
					voronoi.setTotalNumberOfCells(parameters.totalNumberOfCells);
					voronoi.setPercentOfDefectingCells(parameters.percentOfDefectingCells);
					voronoi.setGen_Count(generationCount[i]);
					voronoi.setCoop_Cost(cooperatingCost[j]);
					voronoi.setDist(distanceOfInteraction[k]);
					voronoi.setSites(sites.slice());
					voronois.push(voronoi);
				}
		return voronois;
	}

	$scope.recursiveSimulate = function(i, voronois){
		if (i >= voronois.length)
			return;
		if ($("#cooperatingLimit")[0] != undefined) {
            message = JSON.stringify({
                bbox: voronois[i].getBbox(),
                sites: voronois[i].getSites(),
                gen_count: voronois[i].getGen_Count(),
                coop_cost: voronois[i].getCoop_Cost(),
                dist: voronois[i].getDist(),
                itShouldDivide: $("#itShouldDivide")[0].checked ,
				cooperatingLimit: $("#cooperatingLimit")[0].value,
                steepness1: $("#steepness1")[0].value,
                inflexiosPontHelye1: $("#inflectionPoint1")[0].value,
                steepness2: $("#steepness2")[0].value,
                inflexiosPontHelye2: $("#inflectionPoint2")[0].value,
                shapeOfDif: $scope.shapeOfDif,
                z: $scope.steepnessOfGrad

            });
        } else {
            message = JSON.stringify({
                bbox: voronois[i].getBbox(),
                sites: voronois[i].getSites(),
                gen_count: voronois[i].getGen_Count(),
                coop_cost: voronois[i].getCoop_Cost(),
                dist: voronois[i].getDist(),
                itShouldDivide: $("#itShouldDivide")[0].checked ,
                steepness: $scope.steepness,
                inflexiosPontHelye: $scope.inflectionPoint,
                shapeOfDif: $scope.shapeOfDif,
                z: $scope.steepnessOfGrad

            });
        }

		$scope.connection.send(message);
		$scope.connection.onmessage = function(e) {
            if ($("#cooperatingLimit")[0] != undefined) {
                $.get("../voronoi/warburg", function(data, textStatus, response){
                    if (response.responseText != 'ok'){
                        alert('error');
                    }
                });
            } else {
                $.get("../voronoi/data", function(data, textStatus, response){
                    if (response.responseText != 'ok'){
                        alert('error');
                    }
                });
            }
			$scope.connection.onmessage = function(e) {
				sitesList = JSON.parse(e.data);
				for (let j = 0; j < sitesList.length; ++j){
					sitesList[j] = voronois[i].sitesBadFormatToPointFormat(sitesList[j]);
				}
				let data = voronois[i].getSimulationResults(sitesList);
				$scope.addHighChartsWithData(i, data);
				$scope.recursiveSimulate(i+1, voronois);
			};
		}
	}

	$scope.simulate = function(){

		$("body").addClass("loading");
		$('#panel').empty();
		let voronois = getBaseVoronoiList();
		if (voronois.length == 0){
			$scope.showDangerAlert();
			return;
		}
		voronoiAccessibleFromOutside2 = JSON.stringify({ //testing
			bbox: voronois[0].getBbox(),
			sites: voronois[0].getSites(),
			gen_count: voronois[0].getGen_Count(),
			coop_cost: voronois[0].getCoop_Cost(),
			dist: voronois[0].getDist(),
			itShouldDivide: $("#itShouldDivide")[0].checked,
			steepness: $scope.steepness,
			inflectionPoint: $scope.inflectionPoint,
			shapeOfDif: $scope.shapeOfDif,
			z: $scope.steepnessOfGrad
		});
		$scope.recursiveSimulate(0, voronois);
		$("body").removeClass("loading");		
		$rootScope.hideStatistics = false;
	}
});