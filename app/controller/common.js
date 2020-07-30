/*
 * @Author: jiangyan6
 * @Date: 2019-12-30 22:33:34
 * @Last Modified by: jiangyan6
 * @Last Modified time: 2020-05-09 10:02:42
 * @Desc: 共用controller
 */
'use strict'

const Controller = require('../core/base_controller');
const {
  Post,
  Get
} = require('egg-shell-decorators');

const fs = require('fs')
const path = require('path')
/*
 * @Controller common
 */
class CommonController extends Controller {

  // @Get('/')
  // async getIndex() {
  //   this.ctx.response.type = 'html'
  //   this.ctx.body = fs.readFileSync(path.resolve(__dirname, '../public/dist/index.html'))
  // }
  @Get('/getUserInfo')
  async getUserInfo() {
    const {
      ctx
    } = this
    const data = await ctx.service.common.getUserInfo()
    this.success(data)
  }
  /**
   * @summary  查询全部用户
   * @description 查询全部用户-不分页
   * @Router Get /common/getUserList/search
   */
  @Get('/getUserList/search')
  async getUserList() {
    const {
      ctx
    } = this
    console.log(this.app.baseDir)
    const data = await ctx.service.common.getUserList(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary  查询巡检项关联的巡检方法
   * @description 查询巡检项关联的巡检方法
   * @Router Get /common/getItemManner/by_itemId
   */
  @Get('/getItemManner/by_itemId')
  async getItemManner() {
    const {
      ctx
    } = this
    const data = await ctx.service.common.getItemManner(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary  查询巡检项关联的巡检方法
   * @description 查询巡检项关联的巡检方法
   * @Router Get /common/getItemManner/by_taskItemId
   */
  @Get('/getItemManner/by_taskItemId')
  async getItemMannerByTaskItemId() {
    const {
      ctx
    } = this
    const data = await ctx.service.common.getItemMannerByTaskItemId(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary  查询监控点详情
   * @description 查询监控点详情
   * @Router Get /common/getCameraObj/by_CameraId
   */
  @Get('/getCameraObj/by_CameraId')
  async getCameraObj() {
    const {
      ctx
    } = this

    const data = await ctx.service.common.getCameraObj(ctx.request.query)
    this.success(data)
  }


  /**
   * @summary 获取用户信息格局userid ，分割
   * @description 获取用户信息格局userid ，分割
   * @Router post /common/getUserInfoByUserIds
   * @request body getUserInfoByUserIdsRequest *body
   * @response 200 taskPauseRecordResponse 创建成功
   */
  @Post('/getUserInfoByUserIds')
  async getUserInfoByUserIds() {
    const {
      ctx
    } = this
    const {
      userIds
    } = ctx.request.body
    const data = await ctx.service.common.getUserInfoByUserIds(ctx.request.body)
    this.success(data)
  }


  /**
   * @summary 获取图片详细接口
   * @description 获取图片详细接口
   * @Router post /common/getImageDetail
   * @request body getImageDetailRequest *body
   * @response 200 taskPauseRecordResponse 创建成功
   */
  @Post('/getImageDetail')
  async getImageDetail() {
    const {
      ctx
    } = this
    const {
      imgUrl
    } = ctx.request.body
    const data = await ctx.service.picture.getRealPic(imgUrl)
    this.success(data)
  }
  /**
   * @summary 上传图片
   * @description 用于app端图片上传
   * @Router post /common/uploadPicToAsw
   * @request formData file *file
   * @response 200 imgUploadResponse
   */
  @Post('/uploadPicToAsw')
  async uploadPicToAsw() {
    const {
      ctx
    } = this
    const stream = await this.ctx.getFileStream()
    const data = await ctx.service.common.uploadPicToAsw(stream, ctx.request.query.taskPointId, ctx.request.query.cameraId)
    this.success(data)
  }
  /**
   * @summary 获取图片详细接口
   * @description 获取图片详细接口
   * @Router get /common/getPatrolResultByTaskItemId
   * @request query  patrolTaskItemId *string task巡检项ID
   */
  @Get('/getPatrolResultByTaskItemId')
  async getPatrolResultByTaskItemId() {
    const {
      ctx
    } = this
    const {
      patrolTaskItemId
    } = ctx.request.query
    const data = await ctx.service.common.getPatrolResultByTaskItemId(ctx.request.query)
    this.success(data)
  }
}
module.exports = CommonController
