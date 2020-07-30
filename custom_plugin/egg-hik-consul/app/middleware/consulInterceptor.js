const {
  checkToken,
  checkTokenex,
} = require('../../../../hikidentify/hikidentify');
const FORBIDDEN_ERROR = [ '403', 'Token is null,please apply a token!' ];
const PASS_ERROR = [ '403', 'Token Certified does not pass!' ];
const SYSTEM_ERROR = [ '500', 'Token Certified error!' ];
module.exports = (options, app) => {
  return async (ctx, next) => {
    const {
      tokenCheck,
    } = app.config;
    if (tokenCheck.enable) { // 开启token认证
      const token = ctx.req.headers.Token || ctx.req.headers.token;
      if (!token) {
        ctx.hikLogger.error(FORBIDDEN_ERROR[0], `Invoke restful without Token header. RequestURI: [${ctx.path}]`);
        ctx.hikLogger.error(FORBIDDEN_ERROR[0], FORBIDDEN_ERROR[1]);
        fail(ctx, FORBIDDEN_ERROR);
        return;
      }
      try {
        let checkResult;
        if (tokenCheck.checkex) { // 开启过期时间token认证
          checkResult = checkTokenex(token);
        } else {
          checkResult = checkToken(token);
        }
        if (checkResult !== 'true') {
          ctx.hikLogger.error(PASS_ERROR[0], `Invoke restful but Token not certified. RequestURI: [${ctx.path}]`);
          ctx.hikLogger.error(PASS_ERROR[0], PASS_ERROR[1]);
          fail(ctx, PASS_ERROR);
          return;
        }
      } catch (error) {
        ctx.hikLogger.error(SYSTEM_ERROR[0], error.stack || SYSTEM_ERROR[1]);
        return;
      }
    }
    await next();
  };
};


function fail(ctx, errorObj) {
  ctx.body = {
    type: -1,
    code: errorObj[0],
    msg: errorObj[1],
  };
  ctx.status = 500;
}
