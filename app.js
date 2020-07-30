'use strict'
// 支持修饰器和类指定定义熟悉
require('babel-register')({
  plugins: ['transform-decorators-legacy']
})

const { decryption } = require('hikidentify')
class AppBootHook {
  constructor(app) {
    this.app = app
    console.log(`***进入框架app配置的constructor`)
  }
  _getConfigProperoty(key) {
    if (this.app._configProp) {
      // 用‘=’分割配置项，匹配‘=’前的配置项内容跟传入的key是否相等，相等即代表配置中存在该配置项
      const valueList = this.app._configProp.filter(d => d.split('=')[0] === key)
      if (valueList && valueList.length > 0) {
        return valueList[0].substring(valueList[0].indexOf('=') + 1)
      }
      this.app.logger.warn(key + " does't has the value")
      return key
    }
    this.app.logger.warn('configProp [' + key + '] is undefined,please check config.properties')
    return key
  }
  async didReady() {

  }
}

module.exports = AppBootHook
// global.process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
