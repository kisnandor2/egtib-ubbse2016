/*
 * object.watch polyfill
 *
 * 2012-04-03
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

// object.watch
if (!Object.prototype.watch) {
    Object.defineProperty(Object.prototype, "watch", {
          enumerable: false
        , configurable: true
        , writable: false
        , value: function (prop, handler) {
            var
              oldval = this[prop]
            , newval = oldval
            , getter = function () {
                return newval;
            }
            , setter = function (val) {
                oldval = newval;
                return newval = handler.call(this, prop, oldval, val);
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

const HOST = location.origin.replace(/^http/, 'ws');
const connection = new WebSocket(HOST);
var voronoi;
var dcolor = 150;
var ccolor = 97;
var progressBar;
var sitesList;
var originalSites;
var paused = 0;
var chart;

window.onload = function() {

    progressBar = $("#simulation_progress")[0];
    progressBar.max = 10;
    progressBar.value = 5;
    progressBar.watch('value', function(id, oldVal, newVal){
        let width = 100*newVal/this.max;
        this.style.width = width + '%';
    })

    let canvas = $('#canvas')[0];
    let context = canvas.getContext('2d');
    paper.install(window);
    paper.setup(canvas);
    voronoi = new AnimatableVoronoi(view, context);


    //Distance of interaction
    let defaultDistanceOfInteraction = 1;
    voronoi.setDist(defaultDistanceOfInteraction);
    $('#distanceOfInteraction')[0].value = defaultDistanceOfInteraction;

    //GenerationCount
    let defaultGenerationCount = 1;
    voronoi.setGen_Count(defaultGenerationCount);
    $('#generationCount')[0].value = defaultGenerationCount;


    //Number of non_productive cells
    let nonProductiveCellCount = 0;
    voronoi.setNonCooperatingChance(nonProductiveCellCount);
    $('#numberOfNonProductiveCells')[0].value = nonProductiveCellCount;


    //CellCount
    let defaultCellCount = 16;
    voronoi.setSites(voronoi.generateBeeHivePoints(new Size(Math.floor(Math.sqrt(defaultCellCount)), Math.ceil(Math.sqrt(defaultCellCount))), true));
    $('#totalNumberOfCells')[0].value = defaultCellCount;

    //CoopCost
    let defaultCoopCost = 0.1;
    voronoi.setCoop_Cost(defaultCoopCost);
    $('#cooperaintCost')[0].value = defaultCoopCost;

    voronoi.renderDiagram();

    //-----------------------------------------------------------------
    //-----------------------------------------------------------------
    // pass nunjucks variable with: {{sites|dump|safe}}
    //-----------------------------------------------------------------
    //-----------------------------------------------------------------

    canvas.onclick = function(event) {
        color = context.getImageData(event.offsetX, event.offsetY, 1, 1).data[1];
        console.log(color);
        if (color == dcolor)
            voronoi.onMouseDown(event.offsetX, event.offsetY, 'd');
        if (color == ccolor)
            voronoi.onMouseDown(event.offsetX, event.offsetY, 'c');
    }

    //slow motion
    	/*
    canvas.onmousemove = function(event){
    	color = context.getImageData(event.offsetX, event.offsetY, 1, 1).data[1];
    	if(color==dcolor)
    		voronoi.onMouseMove(event.offsetX,event.offsetY,'d',count);
    	if(color==ccolor)
    			voronoi.onMouseMove(event.offsetX,event.offsetY,'c',count);
    	++count;
    }
*/
    //chart
    chart = Highcharts.chart('highChartsCointainer', {

        chart: {
            type: 'column'
        },

        title: {
            text: 'Number of cells, over time'
        },

        xAxis: {
            categories: []
        },

        yAxis: {
            allowDecimals: false,
            min: 0,
            title: {
                text: 'Number of cells'
            }
        },

        tooltip: {
            formatter: function() {
                return '<b>' + this.x + '</b><br/>' +
                    this.series.name + ': ' + this.y + '<br/>' +
                    'Total: ' + this.point.stackTotal;
            }
        },

        plotOptions: {
            column: {
                stacking: 'normal'
            }
        },

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

    var n = Math.ceil(Math.random() * 100); //ezt kell megkapjam
    var categories = [];
    var numberProductive = [];
    var numberNonProductive = [];
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
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function heartbeat() {
    while (true) {
        if (connection.readyState == 1) {
            connection.send(JSON.stringify({ heartbeat: 'heartbeat' }));
            await sleep(30000);
        } else {
            await sleep(100);
        }
    }
}

// If paused then unpauses otherwise pauses the animation
function pauseSimulation() {
    paused = 1 - paused;
    progressBar.disabled = paused == 0 ? true : false;
    $("#pauseSimulation")[0].value = paused == 0 ? "Pause the Simulation" : "Resume the simulation";
    render(Number(progressBar.value), sitesList.length, sitesList);
}


// Sets new parameters to an existing voronoi graph
function setNewParameters() {
    let coop_cost = Number($('#cooperaintCost')[0].value),
        dist = Math.max(Number($('#distanceOfInteraction')[0].value), 1),
        gen_count = Math.max(Number($('#generationCount')[0].value), 1);
    voronoi.setCoop_Cost(coop_cost);
    voronoi.setDist(dist);
    voronoi.setGen_Count(gen_count);
    progressBar.max = gen_count;
    progressBar.value = 0;
    showPBValue();
}


function render(i, n, sitesList) {
    if (paused == 1) {
        return; 
    }
    if (i >= n) {
    	voronoi.addDataToChart();
        paused = 1;
        $("#pauseSimulation")[0].value = "Resume the simulation";
        $("#renderNewDiagram")[0].disabled = false;
        $("#setNewParameters")[0].disabled = false;
        $("#startSimulation")[0].disabled = false;
        progressBar.disabled = false;
        return;
    }
    setTimeout(function() {
        voronoi.addDataToChart();
        voronoi.setSites(voronoi.sitesBadFormatToPointFormat(sitesList[i]));
        voronoi.renderDiagram();
        progressBar.value++
        showPBValue();
        if (voronoi.getProductiveCount() == 0)
            i = n;
        render(i + 1, n, sitesList);
        return;
    }, 0)
}

function renderone(i, sitesList) {
    setTimeout(function() {
        if (i > 0) {
            voronoi.addDataToChart();
            voronoi.setSites(voronoi.sitesBadFormatToPointFormat(sitesList[i - 1]));
            voronoi.renderDiagram();
            return;
        } else {
            voronoi.addDataToChart();
            voronoi.setSites(voronoi.sitesBadFormatToPointFormat(originalSites));
            voronoi.renderDiagram();
            return;
        }
    }, 0)
}

//Changes slider value
function changePBValue(newValue) {
    renderone(newValue, sitesList);
    progressBar.value = newValue;
    // showPBValue();
}

//Updates the span next to the slider
function showPBValue() {
    document.getElementById("range").innerHTML = "<b>Gen count: " + progressBar.value + "</b>";
}

function renderNewDiagram() {
    progressBar.disabled = false;
    $('#setNewParameters')[0].disabled = false;

    let number = Math.max(Number($('#totalNumberOfCells')[0].value), 0),
        number_non = Number($('#numberOfNonProductiveCells')[0].value),
        gen_count = Math.max(Number($('#generationCount')[0].value), 0),
        coop_cost = Number($('#cooperaintCost')[0].value),
        dist = Math.max(Number($('#distanceOfInteraction')[0].value), 0);

    //Reset the progressBar
    progressBar.min = 0;
    progressBar.max = gen_count;
    progressBar.value = 0;
    // showPBValue();

    try {
        voronoi.setNonCooperatingChance(number_non / number);
        let sites = voronoi.generateBeeHivePoints(new Size(Math.floor(Math.sqrt(number)), Math.ceil(Math.sqrt(number))), true);
        voronoi.setSites(sites);
        voronoi.setGen_Count(gen_count);
        voronoi.setCoop_Cost(coop_cost);
        voronoi.setDist(dist);

        voronoi.resetChart(chart);
        voronoi.renderDiagram();
    } catch (error) {
        voronoi.setNonCooperatingChance(0.5);
        let sites = voronoi.generateBeeHivePoints(new Size(10, 10), true);
        voronoi.setSites(sites);
        voronoi.renderDiagram();
        console.log(error);
    }
}

function startSimulation() {
    paused = 0;
    // presets = $('#presets')[0].value;
    progressBar.value = 0;
    // showPBValue();
    //Send data to server via websocket
    json = JSON.stringify({
        bbox: voronoi.getBbox(),
        sites: voronoi.getSites(),
        gen_count: voronoi.getGen_Count(),
        coop_cost: voronoi.getCoop_Cost(),
        dist: voronoi.getDist(),
        //send more data here
    });

    originalSites = voronoi.getSites();
    connection.send(json);

    connection.onmessage = function(e) {
        //If the websocket processed the information simulate on the server side
        $.get("voronoi/data", function(data, textStatus, response){
        	if (response.responseText != 'ok'){
        		alert("Some error occured on the server side. We are sorry :(");
        	}
        });
        $("body").addClass("loading");
        connection.onmessage = function(e) {
            //Get results via the websocket
            sitesList = JSON.parse(e.data);
            $("body").removeClass("loading")
            $("#renderNewDiagram")[0].disabled = true;
            $("#setNewParameters")[0].disabled = true;
            $("#startSimulation")[0].disabled = true;
            $("#pauseSimulation")[0].disabled = false;
            $("#pauseSimulation")[0].value = "Pause the Simulation";
            progressBar.disabled = true;
            voronoi.resetChart(chart);
            render(0, sitesList.length, sitesList);
        };
    }

}

setTimeout(function() {
    heartbeat();
}, 1000)
