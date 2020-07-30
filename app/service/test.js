/*
 * @Author: renxiaojian
 * @Date: 2020-02-23 09:29:55
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-03-06 21:34:53
 */
'use strict'
const Service = require('egg').Service
const { Transactional } = require('../core/transactionalDeco')
const Sequelize = require('sequelize')
const { Op } = Sequelize
class TestService extends Service {
  /**
   * test  的service
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async testService(params) {
    // 跟model挂载的方法名一一对应
    const result = await this.query('Test', 'queryDataById', [params])
    return result
  }
}
module.exports = TestService
