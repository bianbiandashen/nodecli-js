/*
 * @作者: bianlian
 * @创建时间: 2019-12-17 16:07:46
 * @Last Modified by: jiangyan6
 * @Last Modified time: 2020-07-02 20:43:55
 */

'use strict'
const constant = require('./constant.js')

module.exports = {
  ...constant,
  // 获取用户id
  getUserId () {
    // if (!this.session.cas) {
    //   throw new Error('单点登录未开启，无法获取当前用户信息')
    // }
    if (this.app.env === 'prod') {
      // 部署态返回真实用户信息
      return this.session.cas && this.session.cas.userinfo.split('&&&&')[0]
    }
    // 本地开发指定用户用于测试
    return 'admin'
    // return
  }
}
