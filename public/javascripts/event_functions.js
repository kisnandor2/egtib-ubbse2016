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