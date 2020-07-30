const queryString = require('query-string');
const utils = require('./utils');
const constants = require('constants');
const REG_TICKET = /^ST-[\w\d_\-.]+$/;

/*
 * Validate ticket from CAS server
 *
 * @param ctx
 * @param options
 */
const validateTicket = async (ctx, options) => {
  const query = {
    ticket: ctx.query.ticket,
    service: encodeURIComponent(utils.getPath('clientValidate', options, ctx)) // 验证ST的时候跳回到了哪里
  };
  const {
    logger
  } = ctx;
  const serverValidateUrl = `${utils.getPath('serverValidate', options, ctx)}?${queryString.stringify(query, { encode: false })}`;

  logger.debug(`Sending request to serverValidateUrl "${serverValidateUrl}" to validate ticket.`);
  try {
    const response = await ctx.curl(serverValidateUrl, {
      rejectUnauthorized: false,
      secureOptions: constants.SSL_OP_NO_TLSv1
    });
    logger.debug(`Response status from serverValidateUrl "${serverValidateUrl}" %d `, response.status);
    return response;
  } catch (error) {

    logger.info(`Response status from serverValidateUrl "${serverValidateUrl}" %d `, 500);
    logger.error('Error when sending request to CAS server, error: ', error.toString());
    throw error;
  }
}


const validate = async (ctx, options) => {
  const ticket = (ctx.query && ctx.query.ticket) || null;
  const { logger } = ctx;

  const lastUrl = utils.getLastUrl(ctx, options);
  logger.debug('Start validating ticket...');

  /**
	 * no ticket
	 */
  if (!ticket) {
    logger.debug(`Can\' find ticket in query, redirect to last url: ${lastUrl}`);
    utils.deleteLastUrl(ctx);
    return ctx.redirect(lastUrl);
  }

  /**
	 * ticket is invalid
	 */
  if (!ticket.match(REG_TICKET)) {
    logger.warn(`Ticket '${ticket}' is invalid, validate failed!`);
    ctx.status = 400;
    ctx.body = 'Ticket is invalid, validate failed!';
    return;
  }


  logger.debug('Found ticket in query', ticket);

  /**
	 * session has this ticket
	 */
  if (ctx.session && ctx.session.cas && ctx.session.cas.st && ctx.session.cas.st === ticket) {
    logger.debug(`Ticket in query is equal to the one in session, go last url: ${lastUrl}`);

    const ticket = session.cas.st;
    const sessionKey = ctx.app.config.session.key;
    const sessionId = ctx.cookies.get(sessionKey, { encrypt: true });
    const expireAge = ctx.app.config.session.sessionStoreMaxAge / 1000;
    await ctx.app.redis.expire(sessionId, expireAge);
    await ctx.app.redis.expire('hik_node_sess:' + ticket, expireAge);

    utils.deleteLastUrl(ctx);
    return ctx.redirect(lastUrl);
  }


  /**
	 * try to validate ticket from cas server
	 */
  try {
    const response = await validateTicket(ctx, options);
    /**
		 * status is not "200"
		 */
    if (response.status !== 200) {
      this.app.resDataTrans(response)
      logger.error(`Receive response from cas when validating ticket, but request failed with status code: ${response.status}!`);
      ctx.status = 401;
      ctx.body = {
        message: `Receive response from cas when validating ticket, but request failed with status code: ${response.status}.`
      };
      return;
    }
    try {
      const info = await utils.xml2JsParseString(response.data);
      if (info && info['cas:serviceResponse'] && info['cas:serviceResponse']['cas:authenticationSuccess']) {

        const user = info['cas:serviceResponse']['cas:authenticationSuccess']['cas:user'];
        ctx.session.cas = {};
        ctx.session.cas.userinfo = user;
        ctx.session.cas.st = ticket;
        const sessionKey = ctx.app.config.session.key;
        const sessionId = ctx.cookies.get(sessionKey, { encrypt: true });
        const stAge = await ctx.app.redis.pttl(sessionId);
        try {
          await ctx.app.sessionStore.set('hik_node_sess:' + ticket, {
            sessionid: sessionId
          }, stAge);// 保持和session同样的存活时间

        } catch (err) {
          logger.debug('Trying to store ticket in sessionStore for ssoff failed!');
          logger.error(err);
        }
        logger.debug('validating:lastUrl:' + lastUrl);
        utils.deleteLastUrl(ctx);
        return ctx.redirect(lastUrl);
      }

      ctx.status = 401;
      ctx.body = {
        message: 'Receive response from CAS when validating ticket, but the validation is failed.'
      };
      return;

    } catch (error) {
      const body = {
        error,
        message: error.message
      };
      ctx.status = 500;
      ctx.body = body;
      return
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      message: 'Receive response from cas when validating ticket, but request failed because an error happened.',
      error: error.message
    };
  }
}


module.exports = validate;
