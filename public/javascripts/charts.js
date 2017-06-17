var app = angular.module('myApp', []);

app.controller('filters', function($http, $scope){
	$scope.getData = function(){
		$http({
			url: '/charts/data',
			method: 'GET',
			params: {
				percentOfDefectingCells: $scope.percentOfDefectingCells,
				cooperatingCost: $scope.cooperatingCost,
				distanceOfInteraction: $scope.distanceOfInteraction,
			}
		}).then(function(res){
			if (res.status != 200){
				let text = res.data;
				$("#mainBody").empty();
				$('#error')[0].style.display = 'block';
				return;
			}
			$('#error')[0].style.display = 'none';
			let dataJSON = res.data;
			for (let i = 0; i < dataJSON.length; ++i){
				let current = dataJSON[i];
				if (current == null || current == undefined)
					continue;
				let gen_count = Array.from(Array(current.length).keys());
				let mean = current.map((element) => {return (element.mean).toFixed(2)});
				let min = current.map((element) => {return (element.mean - element.min).toFixed(2)});
				let max = current.map((element) => {return (element.max - element.mean).toFixed(2)});
				addChartToNextDiv("Results", gen_count, mean, min, max);
			}
		})

		function addChartToNextDiv(title, gen_count, mean, min, max){
			jQuery('<div/>', {
				id: title,
			}).appendTo('#mainBody');
			let data = [
				{
					x: gen_count,
					y: mean,
					error_y: {
						type: 'data',
						array: max,
						arrayminus: min,
						visible: true
					},
					type: 'scatter'
				}
			];
			let layout = {
				title: title,
				xaxis: {
	    		title: 'Generation count'
	    	},
	    	yaxis: {
	    		title: 'Fraction of producers',
	    		range: [0, 1]
	    	}
			}
			Plotly.newPlot(title, data, layout);
		}
	}
})
