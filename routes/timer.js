const logger = require('./logger');

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
		ret.push({
			functionName: i,
			execTime: this.getExecTime(i)
		});
	}
	return ret;
}

Timer.prototype.printAllExecTime = function(){
	let time = this.getAllExecTime();
	for (let i = 0; i < time.length; ++i){
		logger.debug('Name: ' + time[i].functionName + ' AvgExecTime: ' + time[i].execTime);
	}
}

module.exports = Timer;