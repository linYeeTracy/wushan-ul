/**
 * 数据库配置
 */
const config = {
  addr: process.env.mongoAddr || 'mongodb://localhost:65521/ws'
};

module.exports = config;
