/*
 * @Author: renxiaojian
 * @Date: 2020-02-25 15:00:49
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-02-25 21:08:01
 */

'use strict'

const Service = require('egg').Service
const { Transactional } = require('../core/transactionalDeco')
const Sequelize = require('sequelize')
const { Op } = Sequelize
function bufferToJson(data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
// 下划线转换驼峰
function toHump(name) {
  return name.replace(/\_(\w)/g, function(all, letter) {
    return letter.toUpperCase()
  })
}
// 处理返回数据
function handleData(data) {
  const resData = {
    lastPage: true
  }
  for (const [key, value] of Object.entries(data)) {
    if (key === 'list') {
      const _value = value.map(item => {
        const resItem = {}
        for (const [innerKey, innerValue] of Object.entries(item)) {
          resItem[toHump(innerKey)] = innerValue
        }
        resItem.isLeaf = false
        return resItem
      })
      resData.rows = _value
    } else {
      resData[key] = value
    }
  }
  return resData
}
class PdmsRegionService extends Service {
  /**
   * 新增区域数据
   */
  @Transactional
  async createRegionData(params) {
    let result = {}
    for (const item of params) {
      result = await this.query('PdmsRegion', 'createData', [item])
    }
    return result
  }
  /**
   * 更新区域数据
   */
  @Transactional
  async updateRegionData(params) {
    let result = {}
    for (const item of params) {
      result = await this.query('PdmsRegion', 'updateData', [item])
    }
    return result
  }
  /**
   * 删除区域数据
   */
  @Transactional
  async deleteRegionData(params) {
    const result = await this.query('PdmsRegion', 'deleteDate', [params])
    return result
  }
  /**
   * 同步pdms的tb_region数据到我们表
   */
  @Transactional
  async synchTreeData() {
    const { ctx } = this
    let responseData
    const result = await this.app.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 10000,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
          filedOptions: []
        }
      }
    )
    responseData = bufferToJson(result.data)
    const list = responseData.data.list.map(item => {
      const resItem = {}
      for (const [innerKey, innerValue] of Object.entries(item)) {
        resItem[toHump(innerKey)] = innerValue
      }
      return resItem
    })
    const res = await ctx.service.pdmsRegion.createRegionData(list, this.transaction)
    return res
  }
  /**
   * 根据modeId获取pdms的tb_region数据
   */
  @Transactional
  async getRegionDataByModelId(modelDataIds) {
    let responseData
    const pageNo = 1
    const pageSize = 10000
    const result = await this.app.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'model_data_id',
              fieldValue: modelDataIds,
              type: 'in'
            }
          ]
        }
      }
    )
    responseData = bufferToJson(result.data)
    return handleData(responseData.data).rows
  }
}

module.exports = PdmsRegionService
