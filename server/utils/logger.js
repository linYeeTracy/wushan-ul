/**
 * logger 模块
 */

const log4js = require('log4js');
const config = require('../config');

const { log4js: log4jsConfig, formatters } = config.log;

log4js.configure(log4jsConfig);

const loggerAccess = log4js.getLogger('access');
const loggerResponse = log4js.getLogger('response');
const loggerError = log4js.getLogger('error');


const logger = {
  accessLog(msg) {
    loggerAccess.info(formatters.access(msg));
  },
  responseLog(ms, ctx) {
    loggerResponse.info(formatters.response(ms, ctx));
  },
  errorLog(err, ctx) {
    loggerError.error(formatters.error(err, ctx));
  }
};

module.exports = logger;
