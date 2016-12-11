const log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/serverLog.log'), 'fileLogger');
const logger = log4js.getLogger('fileLogger');

module.exports = logger;