/*
 * @作者: bianlian
 * @创建时间: 2019-12-13 10:33:38
 * @Last Modified by: jiangyan6
 * @Last Modified time: 2020-03-30 20:57:10
 */
const {
  Get,
  Post
} = require('egg-shell-decorators');


// 【模型数据管理接口】模型数据查询
// 功能描述

// 查询数据模型的数据记录

// 组件版本

// @Since 1.0.0

// 接口URL

// POST /api/v1/model/{modelCode}/records
const Controller = require('../../core/base_controller')

// 去除数组中的 false,null,0,undefiend,NaN
function bouncer(arr) {
  // Don't show a false ID to this bouncer.
  return arr.filter(function(val) {
    return !(!val || val === '')
  })
}

function Uint8ArrayToString(fileData) {
  let dataString = '';
  for (let i = 0; i < fileData.length; i++) {
    dataString += String.fromCharCode(fileData[i]);
  }

  return dataString;
}

function bufferToJson(data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
// 下划线转换驼峰
function toHump(name) {
  return name.replace(/\_(\w)/g, function(all, letter) {
    return letter.toUpperCase();
  });
}
// 数组去重
function dedupe(array) {
  return Array.from(new Set(array));
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
/**
 * @Controller pdms
 */
class PdmController extends Controller {
  @Post('/sensor')
  async sensor() {
    const {
      ctx
    } = this;
    const { regionPath, checkBtn, regionId, patrolObjId, itemId = '', mannerId } = ctx.request.body.data
    let filedOptions = []
    if (checkBtn) {
      filedOptions = [{
        fieldName: 'region_path',
        fieldValue: regionPath,
        type: 'like'
      }]
    } else {
      filedOptions = [{
        fieldName: 'region_id',
        fieldValue: regionId,
        type: 'eq'
      }]
    }
    const result = await this.app.consulCurl('/pdms/api/v1/model/tb_sensor_info/records', 'pdms', 'pdmsweb', {
      method: 'POST',
      data: {
        pageNo: 1,
        pageSize: 1000,
        fields: 'name,sensor_type,measure_high,measure_low,unit,index_code',
        filedOptions
      }
    })
    const responseData = bufferToJson(result.data)
    const resultValue = await ctx.service.patrolObj.quantityService({ patrolObjId, itemId, mannerId });
    responseData.data.list = responseData.data.list.filter(res => {
      return !resultValue.list.some(resChi => resChi.dataValues.extendColumn3 === res.index_code)
    })
    for (const [innerKey, innerValue] of Object.entries(responseData.data.list)) {
      const tranDate = await this.app.consulCurl('/pdms/api/v1/model/tb_transducer/records', 'pdms', 'pdmsweb', {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          fields: 'name',
          filedOptions: [{
            fieldName: 'index_code',
            fieldValue: innerValue.index_code,
            type: 'eq'
          }]
        }
      })
      const resultTra = bufferToJson(tranDate.data).data.list[0] || null
      responseData.data.list[innerKey].deviceName = resultTra

      const deviceDate = await this.app.consulCurl('/pdms/api/v1/model/tb_pe_device/records', 'pdms', 'pdmsweb', {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          fields: 'name',
          filedOptions: [{
            fieldName: 'index_code',
            fieldValue: innerValue.index_code,
            type: 'eq'
          }]
        }
      })
      const resultDev = bufferToJson(deviceDate.data).data.list[0] || null
      responseData.data.list[innerKey].sensorName = resultDev
    }
    this.success(handleData(responseData.data))
  }
  /**
   * @summary 根据组织orgId获取人员
   * @description {orgId}
   * @Router GET /pdms/userList/get/by_orgId
   */
  @Get('/userList/get/by_orgId')
  async getUserListByOrgId() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const userList = await ctx.service.pdms.getUserListByOrgId(ctx.request.query)
    this.success(userList)
  }
  /**
   * @summary 根据用户userId集合获取相关人员
   * @description {userIds}
   * @Router POST /pdms/userList/get/by_userIds
   */
  @Post('/userList/get/by_userIds')
  async getUserListByUserIds() {
    const {
      ctx
    } = this;
    // debugger
    // if (this.app.formatChar(ctx.request.body) === false) {
    //   return this.fail('参数不能含有特殊字符！');
    // }
    const {
      userIds
    } = ctx.request.body
    console.log('ssssssssssssssssss',userIds)
    const userList = await ctx.service.pdms.getUserInfoList(userIds)
    this.success(userList)
  }
  /**
   * @summary 根据角色ID获取相关人员
   * @Router GET /pdms/roleUsers/search
   */
  @Get('/roleUsers/search')
  async getRoleUsers() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const {
      roleId
    } = ctx.request.query
    const personInfoList = await ctx.service.pdms.getPersonListByRoleId(roleId)
    this.success(personInfoList)
  }
  /**
   * @summary 获取角色列表-全部
   * @description {roleName} 模糊查询符合该输入条件的角色名称
   * @Router GET /pdms/rolePage/search
   */
  @Get('/rolePage/search')
  async getRolePage() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.getAllRoles(ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 获取用户列表
   * @description 获取用户列表
   * @Router Get /pdms/userList/get
   */
  @Get('/userList/get')
  async getPersons() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const {
      regionId
    } = ctx.request.query
    let userIds // 用户id集合
    let userInfoList // 用户信息集合
    let personInfoList // 人员信息集合
    // 根据区域ID获取该区域的用户id列表集合
    const userIdsList = await this.app.consulCurl('/isupm/api/privilegeService/v1/regions/users', 'isupm', 'upm', {
      method: 'GET',
      data: {
        privilegeCode: 'view',
        regionIndexCode: regionId,
        resourceType: 'region'
      }
    })
    userIds = bufferToJson(userIdsList.data)
    // 获取用户列表信息列表
    userInfoList = await ctx.service.pdms.getUsersByUserIds(userIds.data.list)
    const personIds = dedupe(bouncer(userInfoList.list.map(item => item.personId)))
    // 获取用户关联的人员信息列表
    let personList
    if (personIds.length > 0) {
      personList = await ctx.service.pdms.getPersonsByPersonIds({
        personIds: personIds.join(','),
        pageNo: 1,
        pageSize: 1000
      })
      personInfoList = personList.list
    } else personInfoList = []
    // 合并用户关联的人员信息
    userInfoList.list = userInfoList.list.map(item => {
      if (personIds.includes(item.personId)) {
        const currentInfo = personInfoList.find(v => v.personId === item.personId)
        return Object.assign({}, item, {
          gender: currentInfo.gender,
          age: currentInfo.age,
          certificateType: currentInfo.certificateType,
          orgPathName: currentInfo.orgPathName
        })
      }
      return Object.assign({}, item, {
        gender: null,
        age: null,
        certificateType: null,
        orgPathName: null
      })
    })
    // const userRoles = await this.app.consulCurl('/isupm/api/roleService/v1/user/roles', 'isupm', 'upm', {
    //   method: 'GET',
    //   data: {
    //     userName: 'renxj'
    //   }
    // })
    // console.log('userRoles==================', bufferToJson(userRoles.data).data.list)
    this.success(userInfoList)
  }
  // 同步pdms异步树数据到巡检引擎
  @Get('/synchTreeData')
  async synchTreeData() {
    const {
      ctx
    } = this;
    let responseData
    const result = await this.app.consulCurl('/pdms/api/v1/model/tb_region/records', 'pdms', 'pdmsweb', {
      method: 'POST',
      data: {
        pageNo: 1,
        pageSize: 1000,
        fields: 'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
        filedOptions: []
      }
    })
    responseData = bufferToJson(result.data)
    const list = responseData.data.list.map(item => {
      const resItem = {}
      for (const [innerKey, innerValue] of Object.entries(item)) {
        resItem[toHump(innerKey)] = innerValue
      }
      return resItem
    })
    await ctx.service.pdmsRegion.createRegionData(list);
    this.success(list)
  }

  /**
   * @summary 获取区域下得社区list
   * @description 获取区域下得社区list
   * @Router GET /pdms/region/community/get
   */

  @Get('/region/community/get')
  async getRegionCommunity() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const data = await ctx.service.pdms.getRegionCommunity(ctx.request.query)
    this.success(data)
  }

  /**
   * @summary 区域树-同步树
   * @description 区域树-同步树
   * @Router GET /pdms/pdms/synchRegionTree
   * @request body synchRegionTreeRequest *body
   * @response 200 asyncTreeResponse
   */

  @Get('/synchRegionTree')
  async synchRegionTree() {
    const {
      ctx
    } = this;
    let responseData
    const result = await this.app.consulCurl('/pdms/api/v1/model/tb_region/records', 'pdms', 'pdmsweb', {
      method: 'POST',
      useHttp: true,
      data: {
        pageNo: 1,
        pageSize: 10000,
        fields: 'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time',
        filedOptions: []
      }
    })
    responseData = bufferToJson(result.data)
    this.success(handleData(responseData.data))
  }

  /**
   * @summary 区域树-异步树
   * @description 区域树-异步树
   * @Router GET /pdms/pdms/asyncTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */
  @Get('/asyncTree')
  async asyncTree() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.asyncRegionTree(ctx.request.query)
    this.success(result)
  }
  /**
   * @summary 区域树-异步树-有用户权限
   * @description 区域树-异步树-有用户权限
   * @Router GET /pdms/pdms/users/asyncRegionTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */
  @Get('/users/asyncRegionTree')
  async asyncTreeByLimit() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.asyncTreeByLimit(ctx.request.query)
    this.success(result)
  }
  /**
   * @summary 区域树-模糊查询
   * @description 区域树-模糊查询
   * @Router GET /pdms/pdms/asyncTree/by_regionName
   * @request body asyncTreeSearchRequest *body
   * @response 200 asyncTreeResponse
   */
  @Get('/asyncTree/by_regionName')
  async asyncTreeSearch() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.asyncRegionTreeSearch(ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 社区列表
   * @description 社区列表
   * @Router GET /pdms/pdms/communityList
   */
  @Get('/communityList')
  async visibleCommunityList() {
    const { ctx } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.visibleCommunityList(ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 区域树-模糊查询-有用户权限
   * @description 区域树-模糊查询-有用户权限
   * @Router GET /pdms/pdms/users/asyncRegionTree/by_regionName
   * @request body asyncTreeSearchRequest *body
   * @response 200 asyncTreeResponse
   */
  @Get('/users/asyncRegionTree/by_regionName')
  async asyncTreeSearchByLimit() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.asyncTreeSearchByLimit(ctx.request.query)
    this.success(result)
  }
  /**
   * @summary 组织树-异步树
   * @description 组织树-异步树
   * @Router GET /pdms/pdms/asyncOrgTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncOrgTreeResponse
   */
  @Get('/asyncOrgTree')
  async asyncOrgTree() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.asyncOrgTree(ctx.request.query)
    this.success(result)
  }
  /**
   * @summary 组织树-异步树-有用户权限
   * @description 组织树-异步树-有用户权限
   * @Router GET /pdms/pdms/users/asyncOrgTree
   * @request body asyncTreeRequest *body
   * @response 200 asyncTreeResponse
   */
  @Get('/users/asyncOrgTree')
  async asyncOrgTreeByLimit() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.asyncOrgTreeByLimit(ctx.request.query)
    this.success(result)
  }
  /**
   * @summary 组织树-模糊查询
   * @description 组织树-模糊查询
   * @Router GET /pdms/pdms/asyncOrgTree/by_OrgName
   * @request body asyncTreeSearchRequest *body
   * @response 200 asyncOrgTreeResponse
   */
  @Get('/asyncOrgTree/by_OrgName')
  async asyncOrgTreeSearch() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.asyncOrgTreeSearch(ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 组织树-模糊查询-有用户权限
   * @description 组织树-模糊查询-有用户权限
   * @Router GET /pdms/pdms/users/asyncOrgTree/by_OrgName
   * @request body asyncTreeSearchRequest *body
   * @response 200 asyncTreeResponse
   */
  @Get('/users/asyncOrgTree/by_OrgName')
  async asyncOrgTreeSearchByLimit() {
    const {
      ctx
    } = this;
    if (this.app.formatChar(ctx.request.query) === false) {
      return this.fail('参数不能含有特殊字符！');
    }
    const result = await ctx.service.pdms.asyncOrgTreeSearchByLimit(ctx.request.query)
    this.success(result)
  }

  /**
   * @summary 设备查询
   * @description 设备查询
   * @Router POST /pdms/pdms/device
   */

  @Post('/device')
  async device() {
    const {
      ctx
    } = this;
    debugger
    const params = ctx.request.body
    const {
      regionId,
      checkChanged,
      rmCode
    } = params
    const pageNo = 1
    const pageSize = 500
    let minData = []
    if (checkChanged) {
      // 包含下级区域
      const midResult = await this.app.consulCurl('/pdms/api/v1/model/tb_region/records', 'pdms', 'pdmsweb', {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields: 'region_id',
          filedOptions: [{
            fieldName: 'region_path',
            fieldValue: regionId,
            type: 'like'
          }]
        }
      })
      minData = bufferToJson(midResult.data).data.list.map(res => res.region_id)
      const total = bufferToJson(midResult.data).data.total
      const length = Math.ceil(total / pageSize);
      // 循环查询区域
      for (let i = 1; i < length; i++) {
        const midResult = await this.app.consulCurl('/pdms/api/v1/model/tb_region/records', 'pdms', 'pdmsweb', {
          method: 'POST',
          data: {
            pageNo: i + 1,
            pageSize,
            fields: 'region_id',
            filedOptions: [{
              fieldName: 'region_path',
              fieldValue: regionId,
              type: 'like'
            }]
          }
        })
        minData = minData.concat(bufferToJson(midResult.data).data.list.map(res => res.region_id))
      }
    } else {
      minData = [regionId]
    }
    // 获取已添加的设备
    const alreadyList = await ctx.service.patrolObj.queryObjDeviceList();
    // 获取设备
    const pdmsStr = `/pdms/api/v1/model/${rmCode}/records`
    const fieldsStr = `region_id,${params.objNameColumn},${params.objUnicodeColumn}`
    const filedOptions = []
    filedOptions.push({
      fieldName: 'region_id',
      fieldValue: dedupe(minData).join(','),
      type: 'in'
    })
    if (params.rmColumnName) {
      filedOptions.push({
        fieldName: params.rmColumnName,
        fieldValue: params.rmColumnValue,
        type: 'eq'
      })
    }
    const result = await this.app.consulCurl(pdmsStr, 'pdms', 'pdmsweb', {
      method: 'POST',
      data: {
        pageNo,
        pageSize,
        fields: fieldsStr,
        filedOptions
      }
    })
    const responseData = bufferToJson(result.data)
    responseData.data.list = responseData.data.list.filter(res => {
      return !alreadyList.some(obj => obj.dataValues.modelDataId === res[params.objUnicodeColumn])
    })
    responseData.data.list = responseData.data.list.map(res => {
      const obj = res
      obj.objUnicodeColumn = params.objUnicodeColumn
      obj.objNameColumn = params.objNameColumn
      obj.patrolObjName = res[params.objNameColumn]
      obj.modelDataId = res[params.objUnicodeColumn]
      obj.rmCode = rmCode
      return obj
    })
    this.success(handleData(responseData.data))
  }
}
module.exports = PdmController
