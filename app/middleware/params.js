// edit by bianbian
/**
 * 获取请求参数中间件
 * 可以使用ctx.params获取get或post请求参数
 */
const regularStr = /\'|\\|\?|"|<|>|\|/
// 不走校验的接口放到数组中
const arr = [
  'capturePicForRefPic',
  'downReportPdf',
  'urlToBase64',
  'questionManage/getQuestionList/search',
  'task/taskList/search',
  'patrolObj/search',
  'api/v1/appApi/patrolObj/search',
  '/inspectionObjectView/inspection/query',
  '/aiEvent/candidate/query',
  '/inspectionConclusion/online/add'
]
function formatChar (data = {}) {
  let switchData = true
  Object.values(data).forEach(res => {
    if (typeof res === 'string') {
      if (regularStr.test(res)) {
        switchData = false
      }
    } else if (typeof res === 'object' && res !== null && !Array.isArray(res)) {
      // todo数组这边还是有问题只能对是对象的且不是数组的校验
      switchData = formatChar(res)
    }
  })
  return switchData
}

module.exports = (options, app) => {
  function _getConfigProperoty (key) {
    // console.log(JSON.stringify(this))
    if (app._configProp) {
      const valueList = app._configProp.filter(d => d.indexOf(key) > -1)
      if (valueList && valueList.length > 0) {
        return valueList[0].substring(valueList[0].indexOf('=') + 1)
      }
      app.logger.warn(key + " does't has the value")
      return key
    }
    app.logger.warn('configProp [' + key + '] is undefined,please check config.properties')
    return key
  }
  return async function params (ctx, next) {
    // csrf
    if (ctx.req.headers['x-requested-with'] === 'XMLHttpRequest' && process.env.NODE_ENV !== 'development') {
      const queue = _getConfigProperoty('patrolengine-queue.@instanceList')
      const ip = _getConfigProperoty(`${queue}.@parent.@ip`)
      if (!ctx.req.headers.referer.includes(ip)) {
        throw new Error('csrf报警')
      }
    }
    ctx.params = Object.assign({}, ctx.query, ctx.request.body)
    const onOff = arr.every(v => ctx.url.indexOf(v) < 0)
    if (formatChar(ctx.params) === false && onOff) {
      throw new Error(this.ctx.__('middleware.requestParamsHasEspecialWord'))
    }

    // 全局对所有的 header 的userid 做base64 的加密服务
    ctx.req.headers.userid =
      ctx.req.headers.userid && app.decodeCommonBase64String(ctx.req.headers.userid)
    await next()
  }
}
