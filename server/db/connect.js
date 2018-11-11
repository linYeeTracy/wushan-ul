/**
 * mongoose 连接
 */

const mongoose = require('mongoose');
const debug = require('debug')('ex:server:db');
const config = require('../config');

// mongoose.set('debug', true);

debug.enabled = true;

mongoose.Promise = Promise;

mongoose.connect(config.db.addr);

mongoose.connection
  .on('connected', () => {
    debug('数据库连接成功');
  })
  .on('disconnected', () => {
    debug('数据库链接断开');
  })
  .on('error', (error) => {
    debug(`数据库创建失败:${error}`);
  });
