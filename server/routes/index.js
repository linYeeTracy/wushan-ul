/**
 * 路由模块
 */

const router = require('koa-router')();
const custom = require('./custom');

// 登陆模块
router.use(
  '/api/v1/customManager/customs/',
  custom.routes(),
  custom.allowedMethods()
);

module.exports = router;
