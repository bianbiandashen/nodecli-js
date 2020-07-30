const qs = require('query-string')
const url = require('url')
const xml2js = require('xml2js')
const pathToRegExp = require('path-to-regexp')

/*
 * 获取去掉ticket参数后的完整路径
 *
 * @param ctx
 * @param options
 * @returns {string}
 */
const getOrigin = (ctx, options) => {
  const query = ctx.query
  if (query.ticket) delete query.ticket
  const querystring = qs.stringify(query)
  if (!options) {
    throw new Error('no options!!!')
  }
  //	ctx.logger.info('getOrigin %s', options.clientOrigin)//TODO  /处理
  //	return options.appUrl + ctx.path + (querystring ? `?${querystring}` : '');
  let appUrl = options.appUrl
  console.log('appurl', appUrl)
  if (ctx.app.config.proxy) {
    // 开启代理的情况下使用nginx代理的协议和host
    const proxyProtocol = ctx.protocol
    const proxyHost = ctx.host
    console.log('ctxctxctxctxctxctxctx', ctx)

    console.log('proxyHost', proxyHost)
    const appUrlParse = url.parse(options.appUrl, true)
    appUrl = proxyProtocol + '://' + proxyHost + appUrlParse.pathname

    if (appUrl.endsWith('/')) {
      appUrl = appUrl.substring(0, appUrl.length - 1)
    }
  }

  return appUrl + url.parse(ctx.originalUrl, true).pathname + (querystring ? `?${querystring}` : '')
}

const setLastUrl = (ctx, options) => {
  ctx.session.lastUrl = getOrigin(ctx, options)
  console.log('setLastUrlsetLastUrlsetLastUrl', getOrigin(ctx, options))
}

const deleteLastUrl = (ctx, options) => {
  if (ctx && ctx.session && ctx.session.lastUrl) {
    delete ctx.session.lastUrl
  }
}

/**
 * lastUrl
 * @param {*} ctx
 * @param {*} options
 */
const getLastUrl = (ctx, options) => {
  let lastUrl = ctx.session && ctx.session.lastUrl ? ctx.session.lastUrl : '/'

  const uri = url.parse(lastUrl, true)

  if (uri.pathname === options.appLogin) lastUrl = '/'

  ctx.logger.debug(`Get lastUrl: ${lastUrl}`)

  return lastUrl
}

const setReferUrl = (ctx, options) => {
  ctx.session.referUrl = ctx.get('Referer')
  console.log('================setReferUrl')
  console.log('================setReferUrl', ctx.get('Referer'))
}

const getReferUrl = (ctx, options) => {
  let referUrl = ctx.session && ctx.session.referUrl ? ctx.session.referUrl : '/'

  const uri = url.parse(referUrl, true)

  if (uri.pathname === options.appLogin) referUrl = '/'

  ctx.logger.debug(`Get referUrl: ${referUrl}`)

  return referUrl
}

/**
 * 获取配置好的对应path
 * @param {*} name
 * @param {*} options
 */
const getPath = (name, options, ctx) => {
  if (!name || !options) return ''
  let path = ''
  // edit by bian
  let {
    casUrl,
    appUrl,
    appLogin,
    casServiceValidateUrl,
    casServerLogin,
    serverLogin,
    casServerkeepAlive
  } = options

  let ref = ''
  let finalUrl = ''
  if (ctx.app.config.proxy) {
    // 开启代理的情况下使用nginx代理的协议和host
    const proxyProtocol = ctx.protocol
    const proxyHost = ctx.host
    const casUrlParse = url.parse(casUrl, true)
    casUrl = proxyProtocol + '://' + proxyHost + casUrlParse.pathname
    const appUrlParse = url.parse(appUrl, true)
    appUrl = proxyProtocol + '://' + proxyHost + appUrlParse.pathname
    if (appUrl.endsWith('/')) {
      appUrl = appUrl.substring(0, appUrl.length - 1)
    }
    // !isNaN("10.14".charAt(0)) true 判断是内网环境
    // if (port && !isNaN(proxyHostUrl.charAt(0))) {
    // if (port) {
    //   casServiceValidateUrl =
    //     proxyProtocol +
    //     '://' +
    //     casServiceValidateUrl.split('/bic')[0] +
    //     `:${port}/bic/ssoService/v1`
    // } else {
    //   casServiceValidateUrl =
    //     proxyProtocol + '://' + casServiceValidateUrl.split('/bic')[0] + '/bic/ssoService/v1'
    // }
    // casServiceValidateUrl = casServiceValidateUrl.split('/bic')[0] + `:${port}/bic/ssoService/v1
    ref = ctx.get('Referer')
    // 适配 巡检引擎的插件
    if (ref && ref.split('?appId') && ref.split('?appId').length > 0) {
      finalUrl = ref.split('?appId')[0]
    } else {
      finalUrl = ref.split('?appId')[0]
    }
    // 重定向的 接口错误时的回调页面
    console.log('finalUrl=========================================', finalUrl)
  }

  switch (name) {
    case 'login':
      path = `${casUrl + serverLogin}?service=${encodeURIComponent(appUrl + appLogin)}` // contextPath+
      break
    case 'serverValidate':
      path = casServiceValidateUrl + casServerLogin
      break
    case 'clientValidate':
      path = encodeURIComponent(appUrl + appLogin) // contextPath+
      break
    case 'appHome':
      path = finalUrl // contextPath+
      break
    case 'keepAlive':
      path = casServiceValidateUrl + casServerkeepAlive
      break
    default:
      throw new Error(`utils.getPath argv name = ${name} is not support`)
  }
  return path
}

/**
 * xml2JsParseString
 * @param {XML} xml
 * @param {Object} options
 * @return {Promise}
 */
const xml2JsParseString = async (xml, options) => {
  options = {
    /*  Always put child nodes in an array if true; otherwise an array is created only if there is more than one. */
    explicitArray: false,
    /* Ignore all XML attributes and only create text nodes */
    ignoreAttrs: true,
    ...options
  }
  return new Promise(resolve => {
    xml2js.parseString(xml, options, (err, result) => {
      if (err) {
        return reslove(false)
      }
      return resolve(result)
    })
  })
}

const shouldIgnore = (ctx, options) => {
  const path = ctx.path
  const { ignore } = options

  if (options.ignore && options.ignore.splice && options.ignore.length) {
    let matchedIgnoreRule
    const hasMatchIgnore = options.ignore.some(function(rule) {
      matchedIgnoreRule = rule
      return isMatchRule(ctx, ctx.path, rule)
    })

    if (hasMatchIgnore) {
      ctx.logger.debug('Matched ignore rule.', matchedIgnoreRule, ' Go through CAS.')
      return true
    }

    return false
  }

  return false
}
function string2Base64(value) {
  return new Buffer(value).toString('base64')
}

function isMatchRule(ctx, pathname, rule) {
  if (typeof rule === 'string') {
    return pathname.indexOf(rule) > -1
  } else if (rule instanceof RegExp) {
    return rule.test(pathname)
  } else if (typeof rule === 'function') {
    return rule(pathname, ctx)
  }
}

module.exports = {
  getOrigin,
  getPath,
  getLastUrl,
  setLastUrl,
  deleteLastUrl,
  setReferUrl,
  getReferUrl,
  xml2JsParseString,
  shouldIgnore
}
