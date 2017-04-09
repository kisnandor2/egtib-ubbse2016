var app = angular.module('myApp', []);

app.controller('fillWithData', function($scope, $rootScope) {
	$.get('/charts/data', (data) => {
		let dataJSON = JSON.parse(data);
		for (let i = 0; i < dataJSON.length; ++i){
			let current = dataJSON[i];
			let gen_count = Array.from(Array(current.length).keys());
			let mean = current.map((element) => {return (element.mean).toFixed(2)});
			let min = current.map((element) => {return (element.mean - element.min).toFixed(2)});
			let max = current.map((element) => {return (element.max - element.mean).toFixed(2)});
			addChartToNextDiv(i+1, gen_count, mean, min, max);
		}
	})

	function addChartToNextDiv(i, gen_count, mean, min, max){
		let id = 'chart' + i;
		jQuery('<div/>', {
			id: id,
		}).appendTo('#body');
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
			title: 'Distance: ' + i,
			xaxis: {
    		title: 'Generation count'
    	},
    	yaxis: {
    		title: 'Fraction of producers'
    	}
		}
		Plotly.newPlot(id, data, layout);
	}

})
