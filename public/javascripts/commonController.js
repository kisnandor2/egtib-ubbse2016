/**
 * Created by Reka on 6/5/2017.
 */
angular.module("commonApp", [])
    .directive('voronoiColumnChart', function(){
        return {
            restrict: 'EAC',
            scope: {
                title: '@',
                data: '='
            },
            link: function (scope, element) {
                var chart = Highcharts.chart(element[0], {
                    chart: {
                        width: null,
                        type: 'column'
                    },
                    title: {
                        text: scope.title
                    },
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
                    series: scope.data
                });

                scope.$watch('data', function(newVal) {
                    if (newVal) {
                        for (var i=0; i<chart.series.length; ++i){
                            chart.series[i].setData(scope.data[i].data);
                        }
                    }
                }, true);
            }
        };
    })