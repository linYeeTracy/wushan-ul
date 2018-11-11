/**
 * 日志配置
 */

const path = require('path');

const baseDir = path.join(__dirname, '../logs');

const getClientIp = req => req.headers['x-forwarded-for'] ||
  req.connection.remoteAddress ||
  req.socket.remoteAddress ||
  req.connection.socket.remoteAddress;

const config = {
  dir: baseDir,
  log4js: {
    appenders: {
      access: {
        type: 'dateFile',
        filename: path.join(baseDir, 'access', 'access'),
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true
      },
      response: {
        type: 'dateFile',
        filename: path.join(baseDir, 'response', 'response'),
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '[%d] [%p] %c \n%m\n'
        }
      },
      error: {
        type: 'dateFile',
        filename: path.join(baseDir, 'error', 'error'),
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '[%d] [%p] %c \n%m\n'
        }
      }
    },
    categories: {
      default: {
        appenders: ['access', 'response', 'error'], level: 'info'
      },
      access: {
        appenders: ['access'], level: 'info'
      },
      response: {
        appenders: ['response'], level: 'info'
      },
      error: {
        appenders: ['error'], level: 'error'
      }
    }
  },
  formatters: {
    access(msg) {
      return msg;
    },
    response(ms, ctx) {
      const clientIp = getClientIp(ctx.req);
      const method = ctx.method;
      const url = ctx.url;
      const body = ctx.request.body;
      const response = ctx.response;

      return {
        clientIp, method, url, body, response, ms
      };
    },
    error(err, ctx) {
      const clientIp = getClientIp(ctx.req);
      const method = ctx.method;
      const url = ctx.url;
      const body = ctx.request.body;

      return {
        clientIp, method, url, body, err
      };
    }
  }
};

module.exports = config;
