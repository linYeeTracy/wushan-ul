/**
 * responese 格式化
 */

module.exports = function () {
  return async function (ctx, next) {
    ctx.resp = {
      success(data, page, status, message) {
        if (typeof page === 'number') {
          [page, status, message] = [undefined, page, status];
        }
        ctx.status = 200;
        ctx.body = {
          meta: {
            status: status || 0,
            message: message || '操作成功'
          },
          data
        };
        page && (ctx.body.page = page);
      },
      fail(message) {
        ctx.status = 500;
        ctx.body = {
          meta: {
            status: 1,
            message: message || '服务端错误'
          }
        };
      }
    };
    await next();
  };
};
