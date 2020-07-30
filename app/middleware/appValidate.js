const hikIdentify = require('../../hikidentify/hikidentify/index.js');
module.exports = (options, app) => {
  return async function middlewareOne(ctx, next) {

    if (ctx.url.indexOf(options.appContext) !== -1) {
      if (!hikIdentify.checkToken(ctx.headers.token)) {
        throw new Error(this.ctx.__('middleware.tokenMissingOrInvalid'))
      }
    }
    await next();
  }

}
