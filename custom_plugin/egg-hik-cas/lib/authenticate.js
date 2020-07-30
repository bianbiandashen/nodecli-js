const utils = require('./utils')
const constants = require('constants')
const authenticate = async (ctx, next, options) => {
  ctx.logger.debug('Doing cas authenticating...')

  // 检查是否已经建立起了本地会话
  console.log(
    'ctx.session' + JSON.stringify(ctx.session),
    '_const_cas_assertion_:' + ctx.session._const_cas_assertion_
  )
  ctx.logger.debug('ctx.session' + JSON.stringify(ctx.session))
  if (ctx.session && ctx.session.cas && ctx.session.cas.st) {
    ctx.logger.debug('Find st in session')
    await flushTGT(ctx, options)
    return await next()
  }
  // if(ctx.cookies.CASTGC){
  //   casLoginUrl = options.casLogin +'?login='

  // }
  ctx.logger.debug('Can not find st in session: ', ctx.session)

  // 设置上一次访问的url
  utils.setLastUrl(ctx, options)

  ctx.logger.debug('ctx.sessionctx.sessionctx.sessionctx.session' + utils.setLastUrl(ctx, options))

  // 身份过期后如果有ajax请求来，则根据设置的ajax header返回设置的状态码
  if (
    (options.fromAjax && options.fromAjax.header && ctx.get(options.fromAjax.header)) ||
    (ctx.get('accept') && ctx.get('accept').indexOf('application/json') > -1)
  ) {
    ctx.logger.debug(`Need to redirect, but matched AJAX request, send ${options.fromAjax.status}`)
    ctx.status = options.fromAjax.status
    ctx.body = {
      code: ctx.status,
      data: {
        referer: ctx.get('Referer'),
        requestURI: ctx.req.url,
        appUrl: utils.getPath('appHome', options, ctx)
      },
      type: -3,
      message: 'Login status expired, need refresh path'
    }
    return
  }
  // 跳转登录页

  const loginPath = utils.getPath('login', options, ctx)
  ctx.logger.debug('redirect to login page ', loginPath)
  ctx.redirect(loginPath)
}

const flushTGT = async (ctx, options) => {
  const session = ctx.session
  const now = Date.now()
  if (!session.session_expire_time) {
    session.session_expire_time = now
  } else {
    const expireBetweenTime = 1000 * 60 * 5
    const date = session.session_expire_time

    if (now - date > expireBetweenTime) {
      session.session_expire_time = now
      const userinfo = session.cas.userinfo
      if (userinfo && userinfo.indexOf('&&') > -1) {
        const logins = userinfo.split('&&')
        if (logins.length >= 4) {
          const tgt = logins[4]
          ctx.logger.debug('flushTGT and tgt is:' + tgt)
          if (tgt) {
            const keepAliveUrl = utils.getPath('keepAlive', options, ctx)
            const resp = await ctx.curl(keepAliveUrl, {
              method: 'POST',
              contentType: 'json',
              data: {
                CTGT: tgt
              },
              dataType: 'json',
              rejectUnauthorized: false,
              secureOptions: constants.SSL_OP_NO_TLSv1
            })
            ctx.logger.debug(
              'Request time to' +
                expireBetweenTime +
                ', refresh TGT=' +
                tgt +
                ', result=' +
                resp.toString()
            )
          }
        } else {
          ctx.logger.warn('no tgt and userinfo is:' + userinfo)
        }
      }
    }
  }

  const ticket = session.cas.st
  const sessionKey = ctx.app.config.session.key
  const sessionId = ctx.cookies.get(sessionKey, { encrypt: true })
  const expireAge = ctx.app.config.session.sessionStoreMaxAge / 1000
  // const stAge=await ctx.app.redis.ttl(sessionId);
  await ctx.app.redis.expire(sessionId, expireAge)
  await ctx.app.redis.expire('hik_node_sess:' + ticket, expireAge)
  ctx.logger.debug('flushSession expire,st:' + ticket + 'expire time:' + expireAge)
}

module.exports = authenticate
