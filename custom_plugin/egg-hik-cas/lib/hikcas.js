const _ = require('lodash')
const utils = require('./utils')
const authenticate = require('./authenticate')
const validate = require('./validate')
const slo = require('./slo')

const DEFAULT_OPTIONS = {
  casUrl: 'https://127.0.0.1/portal/cas',
  serverLogin: '/login',
  appUrl: 'http://10.20.81.1:8006/imap-web',
  appLogin: '/login',
  appHome: '/home',
  casServiceValidateUrl: 'http://127.0.0.1:8001/bic/ssoService/v1',
  casServerLogin: '/serviceValidate',
  casServerkeepAlive: '/keepAlive',
  ignore: [],
  fromAjax: {
    header: 'X-Requested-With',
    status: 403
  }
}

class HikCas {
  constructor(options) {
    if (!(this instanceof HikCas)) return new ConnectCas(options)

    this.options = _.merge({}, DEFAULT_OPTIONS, options)
    if (!this.options.casUrl || !this.options.appUrl || !this.options.casServiceValidateUrl) {
      throw new Error(
        'Unexpected options.casUrl or options.appUrl or options.casServiceValidateUrl!'
      )
    }
  }
  core() {
    const options = this.options

    return async (ctx, next) => {
      const { method, path } = ctx

      const contextPath = ctx.app.config.contextPath

      if (!ctx.app.sessionStore) {
        throw new Error('You must setup a session store before you can use CAS client!')
      }
      if (!ctx.session) {
        throw new Error(`Unexpected ctx.session ${ctx.session}`)
      }

      if (utils.shouldIgnore(ctx, this.options)) {
        return await next()
      }

      if (method === 'GET' && path === options.appLogin) {
        // contextPath
        return await validate(ctx, options)
      } else if (
        method === 'POST' &&
        path === options.appLogin // contextPath
      ) {
        return await slo(ctx, options)
      }
      return await authenticate(ctx, next, options)
    }
  }
}
module.exports = HikCas
