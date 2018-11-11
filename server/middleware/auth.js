/**
 * 权限 中间件
 */

const utils = require('../utils');

module.exports = function () {
  return async function (ctx, next) {
    const user = ctx.session.user;
    const { acl } = utils.auth;
    const { url, method } = ctx.request;
    try {
      if (url.indexOf('/LoginManager/login') === -1 && method !== 'GET') {
        const allow = await acl.isAllowed(user.roleId, url, method);
        console.log(allow);

        if (allow) {
          await next();
        } else {
          ctx.resp.fail('权限不足');
        }
      } else {
        await next();
      }
    } catch (e) {
      ctx.resp.fail();
    }
  };
};
