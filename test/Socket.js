const chai = require('chai');
const assert = chai.assert;
const logger = require('../routes/logger');
logger.setLevel('OFF');


let portno = process.env.PORT || 3001;
const express = require('express');
let app = express(); 
var server = app.listen(portno);
const fakewebSocket = require('../routes/fakewebsocket');
const fakewebSocketServer = new fakewebSocket(server);


describe('Socket test', function() {

 	it('should return true if we can listen', function() {
        if(fakewebSocketServer.listen()==true) 
            assert.isTrue(true);
        else
            assert.isFalse(false);
      
    });
    it('should return true if we can send data', function() {
      	try {
            fakewebSocketServer.sendData(JSON.stringify([]));
            assert.isTrue(true);
	    }
	    catch (error) {
            logger.error(error);
            fakewebSocketServer.sendData(JSON.stringify("error"));
            assert.isTrue(false);
	    }
    });
 });