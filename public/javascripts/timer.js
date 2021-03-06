var runningInBrowser = true;

if (typeof window === 'undefined') {
	runningInBrowser = false;
}

var logger;

try {
	logger = require('../../routes/logger');
}
catch (error){
	logger = console;
}

/**
 * Timer class - used to measure function execution time
 * @constructor
 * @param {object} obj - any class that has functions
 */
function Timer(obj){
	this.functions = {};
		for(let fname in obj) {
				if(typeof obj[fname] == "function") {
						this.functions[fname] = {
							executionTime: 0, //in nanoseconds
							count: 0
						};
						let func = obj[fname];
						let argumentList = '';
						let i = 0;
						if (runningInBrowser){
							obj[fname] = function(){
								let start = performance.now();
								ret = func.apply(this, arguments);
								let end = performance.now();
								let diff = (end - start) * 1e6; //nanoseconds
								this.timer.add(fname, diff);
								return ret;
							}
						}
						else{
							obj[fname] = function(){
								let start = process.hrtime();
								ret = func.apply(this, arguments);
								let diff = process.hrtime(start);
								this.timer.add(fname, diff[0] * 1e9 + diff[1]);
								return ret;
							}
						}
				}
		}
		logger.debug('Timer initialized');
}

/**
 * Add the measured execution time to correct place
 * @param {string} fname - name of the function
 * @param {double} diff	 - the end-start diff that has to be added
 */ 
Timer.prototype.add = function(fname, diff) {
	this.functions[fname].count++;
	this.functions[fname].executionTime += diff;
};

/**
 * Get the execution time of a function
 * @param 	{string} fname - name of the function
 * @returns {double}
 */
Timer.prototype.getExecTime = function(fname){
	return this.functions[fname].executionTime;// / this.functions[fname].count;
}

/**
 * Get the exec time of all functions in decreasing order
 * @returns {array}
 */
Timer.prototype.getAllExecTime = function(){
	let ret = [];
	for (let i in this.functions){
		if (isNaN(this.getExecTime(i)))
			continue;
		ret.push({
			functionName: i,
			execTime: this.getExecTime(i),
			count: this.functions[i].count
		});
	}
	ret.sort(function(a,b){
		return b.execTime - a.execTime;
	})
	return ret;
}

/**
 * Print the exec time of all functions in milliseconds
 * Also prints the colors used
 */
Timer.prototype.printAllExecTimeWithColors = function(){
	let time = this.getAllExecTime();
	for (let i = 0; i < time.length; ++i){
		if (this.colors[i] == undefined){
			this.colors.push('undef');
		}
		let exec = Math.floor(time[i].execTime*1e-6);
		logger.debug(this.colors[i] + '\t' + exec + 'ms\t' + time[i].functionName);
	}
}

/**
 * Print the exec time of all functions in milliseconds
 */
Timer.prototype.printAllExecTime = function() {
	let time = this.getAllExecTime();
	for (let i = 0; i < time.length; ++i){
		let exec = Math.floor(time[i].execTime*1e-6);
		logger.debug(time[i].count + '\t' + exec + 'ms\t' + time[i].functionName);
	}
};


/**
 * NOT USED!! No need to check it
 * Print the results to a PieChart
 * Uses NChart and canvas - can't be used in windows
 * @param {bool} draw - if true, it will create a drawing. Use false under WIN
 */
Timer.prototype.printToPieChart = function(draw){
	data = [];
	this.colors = ['red', 'blue', 'yellow', 'green', 'purple', 'pink', 'black', 'indigo'];
	time = this.getAllExecTime();
	var len = time.length;
	if (draw){
		len = this.colors.length;
	}
	this.printAllExecTimeWithColors();
	for (let i = 0; i < len; ++i){
		if (isNaN(time[i].execTime))
			continue;
		if (this.colors[i] == undefined){
			this.colors.push('undef');
		}
		let exec = Math.floor(time[i].execTime*10e-6);
		data.push({
			value: exec,
			color: this.colors[i]
		});
	}
	if (draw && !runningInBrowser){
		const Canvas = require('canvas');
		const canvas = new Canvas(800, 800);
		const ctx = canvas.getContext('2d');
		const Chart = require('nchart');
		const fs = require('fs');;
		new Chart(ctx).Pie(
			data,
			{
				scaleShowValues: true,
				scaleFontSize: 24
			}
		);
		canvas.toBuffer(function (err, buf) {
			if (err) throw err;
			fs.writeFile(__dirname + '/../pie.png', buf);
		});
	}
}

if (!runningInBrowser){
	module.exports = Timer;
}
