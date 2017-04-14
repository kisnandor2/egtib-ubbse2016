const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('next', function(func, i, data) {
  func(i, data);
});

module.exports = myEmitter;