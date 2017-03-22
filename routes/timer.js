const logger = require('./logger');
const Canvas = require('canvas');
const canvas = new Canvas(800, 800);
const ctx = canvas.getContext('2d');
const Chart = require('nchart');
const fs = require('fs');;


Function.prototype.clone = function() {
  var that = this;
  var temp = function temporary() { return that.apply(this, arguments); };
  for(var key in this) {
    if (this.hasOwnProperty(key)) {
      temp[key] = this[key];
    }
  }
  return temp;
};

function Timer(obj){
	this.colors = ['red', 'blue', 'yellow', 'green', 'purple', 'pink', 'black', 'indigo'];
	this.functions = {};
    for(let fname in obj) {
        if(typeof obj[fname] == "function") {
            this.functions[fname] = {
            	executionTime: 0, //in nanoseconds
            	count: 0
            };
            func = obj[fname];
            let argumentList = '';
            let i = 0;
            let clonedFunc = func.clone();
            obj[fname] = function(params){
            	let start = process.hrtime();
            	ret = clonedFunc.apply(this, arguments);
            	let diff = process.hrtime(start);
            	this.timer.add(fname, diff[0] * 1e9 + diff[1]);
            	return ret;
            }
        }
    }
    logger.debug('Timer initialized');
}

Timer.prototype.add = function(fname, diff) {
	this.functions[fname].count++;
	this.functions[fname].executionTime += diff;
};

Timer.prototype.getExecTime = function(fname){
	return this.functions[fname].executionTime / this.functions[fname].count;
}

Timer.prototype.getAllExecTime = function(){
	let ret = [];
	for (let i in this.functions){
		if (isNaN(this.getExecTime(i)))
			continue;
		ret.push({
			functionName: i,
			execTime: this.getExecTime(i)
		});
	}
	ret.sort(function(a,b){
		return b.execTime - a.execTime;
	})
	return ret;
}

Timer.prototype.printAllExecTime = function(){
	let time = this.getAllExecTime();
	for (let i = 0; i < time.length; ++i){
		logger.debug('Name: ' + time[i].functionName + ' AvgExecTime: ' + time[i].execTime);
	}
} 

Timer.prototype.printToPieChart = function(){
	data = [];
	time = this.getAllExecTime();
	for (let i = 0; i < this.colors.length; ++i){
		if (isNaN(time[i].execTime))
			continue;
		let exec = Math.floor(time[i].execTime*10e-6);
		console.log(this.colors[i] + '\t' + exec + '\t\t' + time[i].functionName);
		data.push({
			value: exec,
			color: this.colors[i]
		});
	}
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

module.exports = Timer;