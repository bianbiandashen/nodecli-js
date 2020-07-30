'use strict'
const { Post } = require('egg-shell-decorators')
const Controller = require('../core/base_controller')
const Exception = require('../core/Exception')
/**
 * @Controller Test
 */

class TestController extends Controller {
  /**
   * @summary 添加模板
   * @description 添加模板
   * @Router POST /test/add
   * @request body testRequest *body
   * @response 200 testResponse 添加成功
   */

  @Post('/test/add')
  async test() {
    const { ctx } = this
    try {
      const id = (await ctx.service.test.testService(ctx.request.body)) || {}
      this.operateLog(
        'log.moduleId.patrolObj.displayName',
        'log.moduleId.patrolObjAdd.displayName',
        '',
        'log.action.add.displayName',
        '操作日志对象******',
        '',
        1
      )
      // 设置响应体和状态码
      this.success(id)
    } catch (error) {
      this.operateLog(
        'log.moduleId.patrolObj.displayName',
        'log.moduleId.patrolObjAdd.displayName',
        '',
        'log.action.add.displayName',
        '操作日志对象******',
        '',
        0
      )
      throw new Exception(error.message, error.code, error.transaction)
    }
  }
}
module.exports = TestController
