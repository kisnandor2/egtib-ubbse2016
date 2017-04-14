const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('send', function(res) {
  res.status(200).send('ok');
});

module.exports = myEmitter;