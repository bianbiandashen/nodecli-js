'use strict'

const Service = require('egg').Service
const { Transactional } = require('../core/transactionalDeco')
const Sequelize = require('sequelize')
const { Op } = Sequelize
// 数组去重
function dedupe(array) {
  return Array.from(new Set(array))
}
function bouncer(arr) {
  // Don't show a false ID to this bouncer.
  return arr.filter(function(val) {
    return !(!val || val === '')
  })
}
function bufferToJson(data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}
// 下划线转换驼峰
function toHump(name) {
  return name.replace(/\_(\w)/g, function(all, letter) {
    return letter.toUpperCase()
  })
}

async function handleUserRegionTreeData(data, that, userId) {
  const treeData = {
    lastPage: data.total <= data.pageNo * data.pageSize
  }
  for (const [key, value] of Object.entries(data)) {
    if (key === 'list') {
      const _value = value.map(item => {
        const resItem = {}
        for (const [innerKey, innerValue] of Object.entries(item)) {
          if (innerKey === 'parentIndexCode') {
            resItem.parentRegionId = innerValue
          } else if (innerKey === 'regionIndexCode') {
            resItem.regionId = innerValue
          } else if (innerKey === 'regionPath') {
            resItem[innerKey] = innerValue.replace(/,/g, '@')
          } else if (innerKey === 'childRegionStatus') {
            resItem.isLeaf = innerValue === 0
          } else {
            resItem[innerKey] = innerValue
          }
        }
        return resItem
      })
      treeData.rows = _value
    } else {
      treeData[key] = value
    }
  }
  const { ctx } = that
  for (const i of treeData.rows) {
    const regionObj =
      (await ctx.service.pdms.treePathAndEegionType(
        i.regionPath || '',
        i.regionId || '',
        that.transaction
      )) || {}
    i.regionPathFullName = regionObj.regionPathName
    i.regionType = regionObj.regionType
  }
  if (userId) {
    const userIdArr = userId.split(',')
    console.log('2020623+++++++++++++++++', userIdArr)
    const userList = await ctx.service.pdms.getUsersByUserIds(userIdArr, that.transaction)
    console.log('2020622+++++++++++++++++', userList)
    const personIds = dedupe(bouncer(userList.list.map(item => item.personId)))
    const personListResult = await that.ctx.consulCurl(
      '/pdms/api/v1/model/tb_person/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 100,
          fields: '*',
          filedOptions: [
            {
              fieldName: 'person_id',
              fieldValue: personIds.join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (personListResult) {
      const personList = bufferToJson(personListResult && personListResult.data)

      console.log('2020621+++++++++++++++++', personList)
      const person =
        personList &&
        personList.data &&
        personList.data.list &&
        personList.data.list.length > 0 &&
        personList.data.list[0]
      console.log('2020620+++++++++++++++++', person)
      treeData.map = {}
      treeData.map.orgId = person.org_id
      treeData.map.orgPath = await ctx.service.pdms.treeOrgPath(
        person.org_path || '',
        that.transaction
      )
    }
  }

  return treeData
}
function handleUserOrgTreeData(data) {
  const treeData = {
    lastPage: data.total <= data.pageNo * data.pageSize
  }
  for (const [key, value] of Object.entries(data)) {
    if (key === 'list') {
      const _value = value.map(item => {
        const resItem = {}
        for (const [innerKey, innerValue] of Object.entries(item)) {
          if (innerKey === 'orgPath') {
            resItem[innerKey] = innerValue.replace(/\//g, '@')
          } else if (innerKey === 'childOrgStatus') {
            resItem.isLeaf = innerValue === 0
          } else {
            resItem[innerKey] = innerValue
          }
        }
        return resItem
      })
      treeData.rows = _value
    } else {
      treeData[key] = value
    }
  }
  return treeData
}
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
class PdmsService extends Service {
  @Transactional
  async getEventTypeOptions(params) {
    const dictName = []
    const { dictCodeOrDictName } = params
    if (dictCodeOrDictName) {
      const dictCode = dictCodeOrDictName.split(',')
      for (let i = 0; i <= dictCode.length; i++) {
        const result = await this.app.consulCurl(
          '/pdms/api/v1/model/tb_ai_event_type/records',
          'pdms',
          'pdmsweb',
          {
            method: 'get',
            data: {
              dictCodeOrDictName: dictCode[i]
            }
          }
        )
        this.app.resDataTrans(result)
        console.log('result.data', result.data)
        debugger
        console.log(`获取pdms 数据字典 数据:  ${result} `)

        if (result.data.data && result.data.data.length > 0) {
          dictName.push(result.data.data[0].dictName)
        }
      }
    }
    if (dictName && dictName.length) {
      return dictName.join(',')
    }
    return ''
    // console.log(`获取pdms 数据字典: /pdms/api/v1/dataDict/detail ${dictCodeOrDictName}`)
    // const result = await this.app.consulCurl(
    //   '/pdms/api/v1/dataDict/detail',
    //   'pdms',
    //   'pdmsweb',
    //   {
    //     method: 'get',
    //     data: {
    //       dictCodeOrDictName
    //     }
    //   }
    // )
    // this.app.resDataTrans(result)
    // console.log('result.data', result.data)
    // debugger
    // console.log(`获取pdms 数据字典 数据:  ${result} `)

    // if (result.data.data && result.data.data.length > 0) {
    //   return result.data.data[0].dictName
    // }
    // return ''
  }

  /**
   * 动环展示
   */

  @Transactional
  async donghuanShowPdms(params) {
    const { modelDataId } = params
    // 获取tb_sensor_info
    const filedOptions = [
      {
        fieldName: 'model_data_id',
        fieldValue: modelDataId,
        type: 'eq'
      }
    ]
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_sensor_info/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          fields: 'name,alarm_low,alarm_high,unit,sensor_type',
          filedOptions
        }
      }
    )
    return bufferToJson(result.data).data
  }
  /**
   * 消息全部已读
   */

  @Transactional
  async updateAllMessageReadFlag(params) {
    const { userId } = params
    const result = await this.ctx.consulCurl('/tlnc/api/v2/message/clearance', 'tlnc', 'tlncweb', {
      method: 'POST',
      data: {
        userId
      }
    })
    return bufferToJson(result.data).data
  }
  /**
   * 代办删除接口
   */

  @Transactional
  async agencyDelete(params) {
    const { apiType = 'app', userId, relativeId, taskId } = params

    let messageId = ''
    // relativeid是问题模块得代办
    if (relativeId) {
      const condition = {
        where: {
          relativeId,
          isDelete: 0
        }
        // attributes: []
      }
      const response = await this.query('TransactionFlow', 'findOneData', [condition])
      messageId = response && response.dataValues.transactionId
    } else if (taskId) {
      messageId = taskId
    }
    if (messageId) {
      this.ctx.hikLogger.debug(`准备调用待办删除接口，删除的待办id：${messageId}`)
      this.ctx.hikLogger.debug({
        apiType,
        messageId,
        userId
      })
      const result = await this.ctx.consulCurl('/tlnc/api/v2/todo/delete', 'tlnc', 'tlncweb', {
        method: 'POST',
        data: {
          apiType,
          messageId,
          userId
        }
      })
      return bufferToJson(result.data).data
    }
    // 获取用户列表信息列表
  }
  /**
   * 消息删除接口
   */

  @Transactional
  async messageDelete(params) {
    const { apiType = 'app', userId, relativeId, taskId } = params

    let messageId = ''
    // relativeid是问题模块得代办
    if (relativeId) {
      const condition = {
        where: {
          relativeId,
          isDelete: 0
        }
        // attributes: []
      }
      const response = await this.query('TransactionFlow', 'findOneData', [condition])
      messageId = response && response.dataValues.transactionId
    } else if (taskId) {
      messageId = taskId
    }
    if (messageId) {
      const result = await this.ctx.consulCurl('/tlnc/api/v2/message/delete', 'tlnc', 'tlncweb', {
        method: 'POST',
        data: {
          apiType,
          messageId,
          userId
        }
      })
      return bufferToJson(result.data).data
    }
  }
  /**
   * 消息删除接口
   */

  @Transactional
  async synchTreeData(params = {}) {
    let result = {}
    for (const item of params) {
      result = await this.query('Pdms', 'createData', [item])
    }
    return result
  }
  /**
   * 查询区域信息
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async getRegionInfo(params = {}) {
    const pageNo = 1
    const pageSize = 1000
    const result = await this.ctx.consulCurl(
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
              fieldName: 'region_id',
              fieldValue: params.regionId,
              type: 'eq'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error('pmds返回无数据')
      throw error
    }
    if (result.status !== 200) {
      const error = new Error('pmds服务异常')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const responseData = handleData(res.data)
    return responseData.rows[0]
  }

  /**
   * 获取教育类型
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */

  @Transactional
  async getAiEventTypeName(params = {}) {
    const pageNo = 1
    const pageSize = 1000
    const { dictCodeOrDictName } = params
    this.ctx.hikLogger.info('请求数据模型/pdms/api/v1/model/tb_ai_event_type/records')
    this.ctx.hikLogger.info(params)
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_ai_event_type/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields: 'event_name',
          filedOptions: [
            {
              fieldName: 'event_type',
              fieldValue: dictCodeOrDictName,
              type: 'eq'
            }
          ]
        }
      }
    )
    const responseData = bufferToJson(result.data)
    if (responseData.code !== '0'){
      this.ctx.hikLogger.info('请求数据模型/pdms/api/v1/model/tb_ai_event_type/records失败参数')
      this.ctx.hikLogger.info(dictCodeOrDictName)
      return ''
    }
    this.ctx.hikLogger.info('请求数据模型/pdms/api/v1/model/tb_ai_event_type/records返回的参数')
    this.ctx.hikLogger.info(responseData)
    return responseData.data.list[0].eventName
  }

  @Transactional
  async getRegionEduRegionType(params = {}) {
    const pageNo = 1
    const pageSize = 1000
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields: 'model_data_id,region_name,edu_region_type',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: params.regionId,
              type: 'eq'
            }
          ]
        }
      }
    )
    const responseData = bufferToJson(result.data)
    const res = handleData(responseData.data)
    return res.rows[0]
  }
  /**
   * 查询区域路径
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */

  @Transactional
  async treePath(params = {}) {
    // 传入的参数可能为空，为空时不能读取replace方法，会报错
    if (!params) {
      return ''
    }
    const reg = /^\@|\@$/g
    const _regionPathArr = params.replace(reg, '').split('@')
    const pageNo = 1
    const pageSize = 10000
    const result = await this.ctx.consulCurl(
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
              fieldName: 'region_id',
              fieldValue: _regionPathArr.join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error('pmds服务异常')
      throw error
    }
    if (result.status !== 200) {
      const error = new Error('pmds模型数据查询接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const responseData = handleData(res.data)

    responseData.rows.sort((prev, next) => {
      return _regionPathArr.indexOf(prev.regionId) - _regionPathArr.indexOf(next.regionId)
    })

    const treePath = responseData.rows.map(item => {
      return item.regionName
    })
    return bouncer(treePath).join('/')
  }
  /**
   * 查询组织路径
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async treeOrgPath(params = {}) {
    // 传入的参数可能为空，为空时不能读取replace方法，会报错
    if (!params) {
      return ''
    }
    const reg = /^\@|\@$/g
    const _orgPathArr = params.replace(reg, '').split('@')
    const pageNo = 1
    const pageSize = 10000
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_org/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'parent_org_id,org_id,org_code,org_name,dis_order,org_path,model_data_id,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'org_id',
              fieldValue: _orgPathArr.join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error('pmds服务异常')
      throw error
    }
    if (result.status !== 200) {
      const error = new Error('pmds模型数据查询接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const responseData = handleData(res.data)

    responseData.rows.sort((prev, next) => {
      return _orgPathArr.indexOf(prev.orgId) - _orgPathArr.indexOf(next.orgId)
    })

    const treePath = responseData.rows.map(item => {
      return item.orgName
    })
    return bouncer(treePath).join('/')
  }
  @Transactional
  async synchTreeDataById(params = {}) {
    const condition = {
      where: {
        regionPath: params.regionPath
      }
    }
    const result = await this.query('Pdms', 'queryDataById', [condition])
    return result
  }
  /**
   * 根据用户userIds集合获取用户列表
   * @param {string} { userIds, 逗号分隔 }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async getUsersByUserIds(userIds) {
    console.log('userIdsssss', userIds)
    // 获取用户列表信息列表
    const userList = await this.ctx.consulCurl('/isupm/api/userService/v1/user', 'isupm', 'upm', {
      method: 'POST',
      data: {
        userIds
      }
    })
    return bufferToJson(userList.data).data
  }
  /**
   * 根据人员信息personId集合获取用户列表
   * @param {string} { personIndexCodeList, 数组集合 }
   * @return {object|null} - 用户列表
   */
  @Transactional
  async getUsersByPersonIds(personIds) {
    console.log('personIds', personIds)
    // 获取用户列表信息列表
    const userList = await this.ctx.consulCurl(
      '/isupm/api/userService/v1/person/users',
      'isupm',
      'upm',
      {
        method: 'POST',
        data: {
          personIds
        }
      }
    )
    return bufferToJson(userList.data).data
  }
  /**
   * pdms
   * 根据组织获取该组织下的人员列表
   */
  @Transactional
  async getUserListByOrgId(params) {
    const { ctx } = this
    let { orgId = -1, pageNo = 1, pageSize = 1000, include } = params
    let total
    let totalPage
    let personList
    let resultPersonList = []
    const paramsData = {
      pageNo,
      pageSize,
      fields: '*'
    }
    if (include && include === '1') {
      paramsData.filedOptions = [
        {
          fieldName: 'org_path',
          fieldValue: orgId,
          type: 'like'
        }
      ]
    } else {
      paramsData.filedOptions = [
        {
          fieldName: 'org_id',
          fieldValue: orgId,
          type: 'eq'
        }
      ]
    }
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_person/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: paramsData
      }
    )
    if (!result) {
      const error = new Error('pmds服务异常')
      throw error
    }
    if (result.status !== 200) {
      const error = new Error('pmds模型数据查询接口调用失败')
      error.status = result.status
      throw error
    }
    personList = bufferToJson(result && result.data)
    if (personList.code !== '0') {
      const error = new Error(personList.msg)
      throw error
    }
    total = personList && personList.data && personList.data.total
    totalPage = Math.ceil(total / pageSize)
    resultPersonList = personList && personList.data && personList.data.list
    for (let i = pageNo; i < totalPage; i++) {
      pageNo = pageNo + 1
      const res = await this.ctx.consulCurl(
        '/pdms/api/v1/model/tb_person/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          data: paramsData
        }
      )
      resultPersonList = [...resultPersonList, ...bufferToJson(res.data).data.list]
    }
    const resultList = []
    const personIds = resultPersonList.map(item => item.person_id)
    const userList =
      personIds && personIds.length > 0
        ? await ctx.service.pdms.getUserListByPersonIds(personIds, this.transaction)
        : []
    if (userList && userList.list && userList.list.length > 0) {
      const userListData = []
      for (const item of userList.list) {
        const userRoles = await ctx.service.pdms.getUserRolesListByUserName(
          item.userName,
          this.transaction
        )
        userListData.push(
          Object.assign({}, item, {
            roleNames: userRoles.map(item => item.roleName).join(',')
          })
        )
      }
      resultPersonList = resultPersonList.map(item => {
        const resItem = {}
        for (const [innerKey, innerValue] of Object.entries(item)) {
          resItem[toHump(innerKey)] = innerValue
        }
        return resItem
      })
      for (const item of userListData) {
        const currentInfo = resultPersonList.find(v => v.personId === item.personId)
        item.orgName = await ctx.service.pdms.treeOrgPath(currentInfo.orgId || '', this.transaction)
        if (currentInfo) {
          resultList.push(
            Object.assign({}, item, {
              orgId: currentInfo.orgId,
              mobile: currentInfo.mobile,
              jobNo: currentInfo.jobNo,
              pinyin: currentInfo.pinyin,
              sex: currentInfo.sex,
              certType: currentInfo.certType,
              certificateNo: currentInfo.certificateNo
            })
          )
        }
      }
    }
    return {
      list: resultList,
      total: resultList.length
    }
  }
  /**
   * 根据用户名userName获取该用户的角色列表
   */
  @Transactional
  async getUserRolesListByUserName(userName) {
    const userRolesList = await this.ctx.consulCurl(
      '/isupm/api/roleService/v1/user/roles',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          userName
        }
      }
    )
    if (!userRolesList) {
      const error = new Error('isupm服务异常')
      throw error
    }
    if (userRolesList.status !== 200) {
      const error = new Error('用户名userName获取该用户的角色列表接口调用失败')
      error.status = userRolesList.status
      throw error
    }
    const res = bufferToJson(userRolesList.data)
    if (!res) {
      const error = new Error('用户名userName获取该用户的角色列表接口无数据')
      throw error
    }
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const roleList = res.data && res.data.list ? res.data.list : []
    return roleList
  }
  /**
   * 根据人员ID获取关联该人员的用户
   */
  @Transactional
  async getUserListByPersonIds(personIdList) {
    // 获取用户列表信息列表
    const userList = await this.ctx.consulCurl(
      '/isupm/api/userService/v1/person/users',
      'isupm',
      'upm',
      {
        method: 'POST',
        data: {
          personIdList
        }
      }
    )
    if (!userList) {
      const error = new Error('调用isupm接口返回异常')
      throw error
    }
    if (userList.status !== 200) {
      const error = new Error('isupm服务根据personIds获取用户列表信息接口调用失败')
      error.status = userList.status
      throw error
    }
    const res = bufferToJson(userList.data)
    if (!res) {
      const error = new Error('isupm服务根据personIds获取用户列表信息接口返回无数据')
      throw error
    }
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * upm
   * 根据roleId获取该角色下的人员列表信息
   */
  @Transactional
  async getPersonListByRoleIdNoUserId(roleId) {
    const { ctx } = this
    const result = await this.ctx.consulCurl(
      '/isupm/api/roleService/v1/role/users',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          roleId
        }
      }
    )
    if (result.status !== 200) {
      const error = new Error('roleId获取该角色下的人员列表信息接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const personInfoList = []
    if (res.data && res.data.list && res.data.list.length > 0) {
      const personIds = dedupe(bouncer(res.data.list.map(item => item.personId)))
      const personList = await ctx.service.pdms.getPersonListByPersonIds(
        {
          personIds: personIds.join(',')
        },
        this.transaction
      )
      for (const item of res.data.list) {
        const currentInfo = personList.find(v => v.person_id === item.personId)
        const userRoles = await ctx.service.pdms.getUserRolesListByUserName(
          item.userName,
          this.transaction
        )
        if (currentInfo) {
          item.orgName = await ctx.service.pdms.treeOrgPath(
            currentInfo.org_id || '',
            this.transaction
          )
          personInfoList.push(
            Object.assign({}, item, {
              sex: currentInfo.sex,
              certType: currentInfo.cert_type,
              certificateNo: currentInfo.certificate_no,
              jobNo: currentInfo.job_no,
              mobile: currentInfo.mobile,
              orgId: currentInfo.org_id,
              roleNames: userRoles.map(item => item.roleName).join(',')
            })
          )
        } else {
          item.orgName = null
          personInfoList.push(
            Object.assign({}, item, {
              sex: null,
              certType: null,
              certificateNo: null,
              jobNo: null,
              mobile: null,
              orgId: null,
              roleNames: userRoles.map(item => item.roleName).join(',')
            })
          )
        }
      }
    }
    return personInfoList
  }
  /**
   * upm
   * 根据roleId获取该角色下的人员列表信息
   */
  @Transactional
  async getPersonListByRoleId(roleId) {
    const { ctx } = this
    const result = await this.ctx.consulCurl(
      '/isupm/api/roleService/v1/role/users',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          roleId
        }
      }
    )
    if (!result) {
      const error = new Error('isupm服务异常')
      throw error
    }
    if (result.status !== 200) {
      const error = new Error('isupm服务根据roleId获取该角色下的人员列表信息接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (!res) {
      const error = new Error('isupm服务根据roleId获取该角色下的人员列表信息接口返回无数据')
      throw error
    }
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    let personInfoList = []
    if (res.data && res.data.list && res.data.list.length > 0) {
      const personIds = dedupe(bouncer(res.data.list.map(item => item.personId)))
      const personList = await ctx.service.pdms.getPersonListByPersonIds(
        {
          personIds: personIds.join(',')
        },
        this.transaction
      )
      for (const item of res.data.list) {
        const currentInfo = personList.find(v => v.person_id === item.personId)
        const userRoles = await ctx.service.pdms.getUserRolesListByUserName(
          item.userName,
          this.transaction
        )
        if (currentInfo) {
          item.orgName = await ctx.service.pdms.treeOrgPath(
            currentInfo.org_id || '',
            this.transaction
          )
          personInfoList.push(
            Object.assign({}, item, {
              sex: currentInfo.sex,
              certType: currentInfo.cert_type,
              certificateNo: currentInfo.certificate_no,
              jobNo: currentInfo.job_no,
              mobile: currentInfo.mobile,
              orgId: currentInfo.org_id,
              roleNames: userRoles.map(item => item.roleName).join(',')
            })
          )
        }
      }
    }
    const userId = ctx.getUserId() || ctx.header.userids
    if (userId) {
      // 获取该用户有权限的区域列表
      const orgList = await ctx.service.pdms.getOrgByUserName(
        {
          userId
        },
        this.transaction
      )
      const orgIdLimit =
        orgList && orgList.list ? orgList.list.filter(n => n.orgStatus === 1).map(v => v.orgId) : []
      personInfoList = personInfoList.filter(v => orgIdLimit.includes(v.orgId) || !v.orgId)
    }
    return personInfoList
  }
  /**
   * 根据userID聚合用户和人员信息
   */
  @Transactional
  async getUserInfoList(userIds) {
    const { ctx } = this
    const userList = await ctx.service.pdms.getUsersByUserIds(userIds, this.transaction)
    const personIds = dedupe(bouncer(userList.list.map(item => item.personId)))
    const personList = await ctx.service.pdms.getPersonListByPersonIds(
      {
        personIds: personIds.join(',')
      },
      this.transaction
    )
    const personInfoList = []
    for (const item of userList.list) {
      const currentInfo = personList.find(v => v.person_id === item.personId)
      const userRoles =
        (await ctx.service.pdms.getUserRolesListByUserName(item.userName, this.transaction)) || []
      if (currentInfo) {
        item.orgName = await ctx.service.pdms.treeOrgPath(
          currentInfo.org_id || '',
          this.transaction
        )
        personInfoList.push(
          Object.assign({}, item, {
            sex: currentInfo.sex,
            certType: currentInfo.cert_type,
            certificateNo: currentInfo.certificate_no,
            jobNo: currentInfo.job_no,
            mobile: currentInfo.mobile,
            orgId: currentInfo.org_id,
            roleNames: userRoles.map(item => item.roleName).join(',')
          })
        )
      } else {
        item.orgName = ''
        personInfoList.push(
          Object.assign({}, item, {
            sex: null,
            certType: null,
            certificateNo: null,
            jobNo: null,
            mobile: null,
            orgId: null,
            roleNames: userRoles.map(item => item.roleName).join(',')
          })
        )
      }
    }
    return personInfoList
  }
  /**
   * 获取全部角色列表
   */
  @Transactional
  async getAllRoles(params) {
    let { roleName = '', pageNo = 1, pageSize = 1000 } = params
    let total
    let totalPage
    let roleList
    let resultRoleList = []
    const result = await this.ctx.consulCurl(
      '/isupm/api/roleService/v1/role/page',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          roleName,
          pageNo,
          pageSize
        }
      }
    )
    roleList = bufferToJson(result && result.data)
    total = roleList && roleList.data && roleList.data.total
    totalPage = Math.ceil(total / pageSize)
    resultRoleList = roleList && roleList.data && roleList.data.list
    for (let i = pageNo; i < totalPage; i++) {
      pageNo = pageNo + 1
      const res = await this.ctx.consulCurl('/isupm/api/roleService/v1/role/page', 'isupm', 'upm', {
        method: 'GET',
        data: {
          roleName,
          pageNo,
          pageSize
        }
      })
      resultRoleList = [...resultRoleList, ...bufferToJson(res.data).data.list]
    }
    return resultRoleList
  }
  /**
   * 根据personID获取人员信息
   */
  @Transactional
  async getPersonListByPersonIds(params) {
    let { personIds = '', pageNo = 1, pageSize = 1000 } = params
    let total
    let totalPage
    let personList
    let resultPersonList = []
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_person/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields: '*',
          filedOptions: [
            {
              fieldName: 'person_id',
              fieldValue: personIds,
              type: 'in'
            }
          ]
        }
      }
    )
    personList = bufferToJson(result && result.data)
    total = personList && personList.data && personList.data.total
    totalPage = Math.ceil(total / pageSize)
    resultPersonList = personList && personList.data && personList.data.list
    for (let i = pageNo; i < totalPage; i++) {
      pageNo = pageNo + 1
      const res = await this.ctx.consulCurl(
        '/pdms/api/v1/model/tb_person/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          data: {
            pageNo,
            pageSize,
            fields: '*',
            filedOptions: [
              {
                fieldName: 'person_id',
                fieldValue: personIds,
                type: 'in'
              }
            ]
          }
        }
      )
      resultPersonList = [...resultPersonList, ...bufferToJson(res.data).data.list]
    }
    return resultPersonList
  }
  // /**
  //  * 获取区域下的社区
  //  * @param {array} { userIds }
  //  * @return {object|null} - 用户列表
  //  */

  // @Transactional
  // async getRegionCommunity() {
  //   const regionData = await this.ctx.consulCurl(
  //     '/api/v1/model/tb_region/records',
  //     'pdms',
  //     'pdmsweb',
  //     {
  //       method: 'POST',
  //       data: {
  //         pageNo: 1,
  //         pageSize: 10000,
  //         fields: 'region_id,region_name,region_type',
  //         filedOptions: [
  //           {
  //             fieldName: 'region_type',
  //             fieldValue: 2,
  //             type: 'eq'
  //           }
  //         ]
  //       }
  //     }
  //   )
  //   const data = bufferToJson(regionData).data
  //   // return data || []
  //   const region = []
  //   if (data.length) {
  //     data.forEach(item => {
  //       region.push(item.region_id)
  //     })
  //   }

  // }

  /**
   * 根据用户personIds集合获取用户关联的人员信息列表
   * @param {array} { userIds }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async getPersonsByPersonIds(params) {
    console.log('getPersonsByPersonIds', params)
    // 获取用户关联的人员信息列表
    // const personList = await this.ctx.consulCurl(
    //   '/irds/service/rs/v2/person/advance/personList',
    //   'irds',
    //   'irds',
    //   {
    //     method: 'POST',
    //     data: {
    //       personIds: params.personIds,

    //       pageNo: params.pageNo || 1,
    //       pageSize: params.pageSize || 1000
    //     }
    //   }
    // )

    const personList = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_person/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: params.pageNo || 1,
          pageSize: params.pageSize || 1000,
          fields: '*',
          filedOptions: [
            {
              fieldName: 'person_id',
              fieldValue: params.personIds,
              type: 'in'
            }
          ]
        }
      }
    )

    // console.log('personList', bufferToJson(personList.data))
    return bufferToJson(personList.data).data
  }

  /**
   * 巡检对象保存到pdms（地图）
   */

  @Transactional
  async patrolObjPdmsAdd(params = []) {
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_patrol_obj/add',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        headers: {
          comId: '1',
          userId: '2'
        },
        data: params
      }
    )
    const responseData = bufferToJson(result.data)
    return bufferToJson(responseData)
  }
  /**
   * 巡检对象自定义pdms
   */

  @Transactional
  async patrolObjPdmsCumAdd(dataParams, pdmsStr) {
    const result = await this.ctx.consulCurl(pdmsStr, 'pdms', 'pdmsweb', {
      method: 'POST',
      headers: {
        comId: '1',
        userId: '2'
      },
      data: dataParams
    })
    const responseData = bufferToJson(result.data)
    return responseData
  }
  /**
   * 删除巡检对象pdms
   * @param {array} { userIds }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async patrolObjPdmsDel(params = []) {
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_patrol_obj/delete',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        headers: {
          comId: '1',
          userId: '2'
        },
        data: {
          modelDataIds: params
        }
      }
    )
    const responseData = bufferToJson(result.data)
    return bufferToJson(responseData)
  }

  /**
   * 修改巡检对象pdms地图
   * @param {array} { userIds }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async patrolObjPdmsUpdate(params = []) {
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_patrol_obj/update',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        headers: {
          comId: '1',
          userId: '2'
        },
        data: params
      }
    )
    const responseData = bufferToJson(result.data)
    return bufferToJson(responseData)
  }

  /**
   * 修改pdms
   * @param {array} { userIds }
   * @return {object|null} - 用户列表
   */

  @Transactional
  async patrolObjPdmsUpdateAll(params = [], str) {
    const result = await this.ctx.consulCurl(str, 'pdms', 'pdmsweb', {
      method: 'POST',
      headers: {
        comId: '1',
        userId: '2'
      },
      data: params
    })
    const responseData = bufferToJson(result.data)
    return bufferToJson(responseData)
  }
  // ======================================== renxiaojian =================================
  /**
   * 异步区域树获取列表
   * @param {array} { parentId,pageNo,pageSize }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncRegionTree(params) {
    const { parentId = -1, pageNo = 1, pageSize = 1000 } = params
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
          filedOptions: [
            {
              fieldName: 'parent_region_id',
              fieldValue: parentId,
              type: 'eq'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error('pdms模型数据查询接口返回无数据')
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error = new Error('pdms模型数据查询接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }

    const handleDataList = handleData(res.data)
    for (const i of handleDataList.rows) {
      i.regionPathFullName = await this.ctx.service.pdms.treePath(i.regionPath || '')
    }

    return handleDataList
  }

  /**
   * 获取用户当前能用的社区列表
   */
  @Transactional
  async visibleCommunityList() {
    const userId = this.ctx.getUserId()
    const midResult = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 1000,
          filedOptions: [
            {
              fieldName: 'region_type',
              fieldValue: 2,
              type: 'eq'
            }
          ]
        }
      }
    )
    // const result = bufferToJson(midResult.data).data.list.filter(node => node.region_type === 2)
    const result = bufferToJson(midResult.data).data.list
    console.log(`-------------------社区树${result}--------------------`)
    const region = []
    if (result.length) {
      result.forEach(item => {
        region.push(item.region_id)
      })
      return await this.ctx.service.pdms.getCommunityRegionByUserName(region, userId, result)
    }
    // // xionghaima
    return []
  }

  // 获取用户有权限的区域同时是社区的区域
  async getCommunityRegionByUserName(indexCode, userId, regionData) {
    // const _data = {
    //   // privilegeCode: 'view',
    //   // resourceType: 'region',
    //   regionIndexCodes: indexCode
    //   // userId
    // }
    const result = await this.ctx.consulCurl(
      `/isupm/api/privilegeService/v1/regions/multiverify?privilegeCode=view&resourceType=region&userId=${userId}`,
      'isupm',
      'upm',
      {
        method: 'POST',
        data: indexCode
      }
    )
    if (!result) {
      const error = new Error('upm查询用户有权限的区域接口返回无数据')
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error = new Error('用户名获取该用户的有权限的区域接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const authorityData = res.data.list
    if (authorityData.length) {
      const data = []
      regionData.forEach(item => {
        authorityData.forEach(itm => {
          item.region_id === itm && data.push(item)
        })
      })
      return data
    }
    return []
  }

  /**
   * 异步区域树获取列表查询—模糊查询
   * @param {array} { searchName }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncRegionTreeSearch(params) {
    const { searchName, pageNo = 1, pageSize = 1000 } = params
    const searchArr = []
    const midResult = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
          filedOptions: [
            {
              fieldName: 'region_name',
              fieldValue: searchName,
              type: 'like'
            }
          ]
        }
      }
    )
    if (!midResult) {
      const error = new Error('pdms服务异常：midRes')
      throw error
    }
    if (midResult.status !== 200) {
      const error = new Error('根据区域名称搜索区域接口调用失败：midRes')
      error.status = midResult.status
      throw error
    }
    const midRes = bufferToJson(midResult.data)
    if (midRes.code !== '0') {
      const error = new Error(midRes.msg)
      throw error
    }
    midRes.data.list.forEach(item => {
      const reg = /^\@|\@$/g
      const _regionPath = item.region_path.replace(reg, '')
      const arr = _regionPath.split('@')
      searchArr.push(...arr)
    })
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: dedupe(searchArr).join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error('pdms服务异常：result')
      throw error
    }
    if (result.status !== 200) {
      const error = new Error('根据区域名称搜索区域接口调用失败：result')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return handleData(res.data)
  }
  /**
   * 异步组织树获取列表
   * @param {array} { parentId,pageNo,pageSize }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncOrgTree(params) {
    const { parentId = -1, pageNo = 1, pageSize = 1000 } = params
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_org/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'parent_org_id,org_id,org_code,org_name,dis_order,org_path,model_data_id,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'parent_org_id',
              fieldValue: parentId,
              type: 'eq'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error('pdms模型数据查询接口返回无数据')
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error = new Error('pdms模型数据查询接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return handleData(res.data)
  }
  /**
   * 异步组织树获取列表查询—模糊查询
   * @param {array} { searchName }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncOrgTreeSearch(params) {
    const { searchName, pageNo = 1, pageSize = 1000 } = params
    const searchArr = []
    const midResult = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_org/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'parent_org_id,org_id,org_code,org_name,dis_order,org_path,model_data_id,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'org_name',
              fieldValue: searchName,
              type: 'like'
            }
          ]
        }
      }
    )
    if (!midResult) {
      const error = new Error('pdms服务异常：midRes')
      throw error
    }
    if (midResult.status !== 200) {
      const error = new Error('根据组织名称搜索区域接口调用失败midRes')
      error.status = midResult.status
      throw error
    }
    const midRes = bufferToJson(midResult.data)
    if (midRes.code !== '0') {
      const error = new Error(midRes.msg)
      throw error
    }
    midRes.data.list.forEach(item => {
      const reg = /^\@|\@$/g
      const _org_path = item.org_path.replace(reg, '')
      const arr = _org_path.split('@')
      searchArr.push(...arr)
    })
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_org/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'parent_org_id,org_id,org_code,org_name,dis_order,org_path,model_data_id,update_time,create_time',
          filedOptions: [
            {
              fieldName: 'org_id',
              fieldValue: dedupe(searchArr).join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error('pdms服务异常：result')
      throw error
    }
    if (result.status !== 200) {
      const error = new Error('根据组织名称搜索区域接口调用失败：result')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return handleData(res.data)
  }
  /**
   * upm
   * 用户名userId获取该用户的有权限的全部区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async getAllRegionByUserName(params) {
    const { userId, pageNo = 1, pageSize = 1000 } = params
    let total
    let totalPage
    let resultList = []
    const _data = {
      pageNo,
      pageSize,
      privilegeCode: 'view',
      resourceType: 'region',
      userId
    }
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/regions/list',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: _data
      }
    )
    if (!result) {
      const error = new Error('upm查询用户有权限的区域接口返回无数据')
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error = new Error('用户名获取该用户的有权限的区域接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    total = res && res.data && res.data.total
    totalPage = Math.ceil(total / pageSize)
    resultList = res && res.data && res.data.list
    for (let i = pageNo; i < totalPage; i++) {
      _data.pageNo = _data.pageNo + 1
      const res = await this.ctx.consulCurl(
        '/isupm/api/privilegeService/v1/regions/list',
        'isupm',
        'upm',
        {
          method: 'GET',
          data: _data
        }
      )
      resultList = [...resultList, ...bufferToJson(res.data).data.list]
    }
    return resultList
  }
  /**
   * upm
   * 用户名userId获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async getRegionByUserName(params) {
    const { userId, parentIndexCode, pageNo = 1, pageSize = 1000 } = params
    const _data = {
      pageNo,
      pageSize,
      privilegeCode: 'view',
      resourceType: 'region',
      userId
    }
    if (parentIndexCode) _data.parentIndexCode = parentIndexCode
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/regions/list',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: _data
      }
    )
    if (!result) {
      const error = new Error('upm查询用户有权限的区域接口返回无数据')
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error = new Error('用户名获取该用户的有权限的区域接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * upm
   * 根据区域名称获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async getRegionLimitBySearchName(params) {
    const { userId, regionName, pageNo = 1, pageSize = 1000 } = params
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/regions/search',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          pageNo,
          pageSize,
          regionName,
          privilegeCode: 'view',
          resourceType: 'region',
          userId
        }
      }
    )
    if (!result) {
      const error = new Error('upm根据区域名称查询用户有权限的区域接口返回无数据')
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error = new Error('upm根据区域名称查询用户有权限的区域接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * upm
   * 用户名userId获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async getOrgByUserName(params) {
    const { userId, parentOrgId, pageNo = 1, pageSize = 1000 } = params
    const _data = {
      pageNo,
      pageSize,
      privilegeCode: 'view',
      resourceType: 'region',
      userId
    }
    if (parentOrgId) _data.parentOrgId = parentOrgId
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/orgs/list',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: _data
      }
    )
    if (!result) {
      const error = new Error('upm查询用户有权限的组织接口返回无数据')
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error = new Error('用户名获取该用户的有权限的组织接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * upm
   * 根据组织名称获取该用户的有权限的组织
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async getOrgLimitBySearchName(params) {
    const { userId, orgName, pageNo = 1, pageSize = 1000 } = params
    const result = await this.ctx.consulCurl(
      '/isupm/api/privilegeService/v1/orgs/search',
      'isupm',
      'upm',
      {
        method: 'GET',
        data: {
          pageNo,
          pageSize,
          orgName,
          userId,
          privilegeCode: 'view'
        }
      }
    )
    if (!result) {
      const error = new Error('upm根据组织名称查询用户有权限的组织接口返回无数据')
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error = new Error('upm根据组织名称查询用户的有权限的组织接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * 用户名userId获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncTreeByLimit() {
    const { ctx } = this
    console.log('--------请求头部-------', ctx.header.userids, ctx.header.appid)
    const { parentId = -1, pageNo, pageSize } = ctx.request.query
    const userId = ctx.getUserId() || ctx.header.userids
    if (userId) {
      // 获取该用户有权限的区域列表
      const result = await ctx.service.pdms.getRegionByUserName(
        {
          userId,
          pageNo,
          pageSize,
          parentIndexCode: parentId
        },
        this.transaction
      )
      return await handleUserRegionTreeData(result, this)
    }
    const result = await ctx.service.pdms.asyncRegionTree(ctx.request.query, this.transaction)
    return result
  }
  /**
   * 用户名userId获取该用户的有权限的区域
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncTreeByLimitByAPP(userId) {
    const { ctx } = this
    const { parentId = -1, pageNo, pageSize } = ctx.request.query

    console.log('userIduserId', userId)
    if (userId) {
      // 获取该用户有权限的区域列表
      const result = await ctx.service.pdms.getRegionByUserName(
        {
          userId,
          pageNo,
          pageSize,
          parentIndexCode: parentId
        },
        this.transaction
      )
      return await handleUserRegionTreeData(result, this, userId)
    }
    console.log('asyncRegionTreeasyncRegionTree', ctx.request.query)
    const result = await ctx.service.pdms.asyncRegionTree(ctx.request.query, this.transaction)

    return result
  }
  /**
   * 用户名userId获取该用户的有权限的区域_模糊查询
   * @param {array} { userId }
   * @return {object|null} - 区域列表
   */
  @Transactional
  async asyncTreeSearchByLimit() {
    const { ctx } = this
    const { searchName, limtRootId, pageNo, pageSize, isAllPath } = ctx.request.query
    const userId = ctx.getUserId()
    if (userId) {
      // 获取该用户有权限的区域列表
      const result = await ctx.service.pdms.getRegionLimitBySearchName(
        {
          userId,
          regionName: searchName,
          pageNo,
          pageSize
        },
        this.transaction
      )
      const regionList = await handleUserRegionTreeData(result, this)
      if (regionList && regionList.rows && limtRootId) {
        regionList.rows = regionList.rows.filter(v => v.regionPath.indexOf(limtRootId) > -1)
      }
      if (isAllPath && isAllPath === '1') {
        const searchArr = []
        const isNowRegionIds = regionList.rows.map(v => v.regionId)
        regionList.rows.forEach(item => {
          const reg = /^\@|\@$/g
          const _regionPath = item.regionPath.replace(reg, '')
          const arr = _regionPath.split('@')
          searchArr.push(...arr)
        })
        const isNoRegionIds = dedupe(searchArr).filter(v => !isNowRegionIds.includes(v))
        const result = await this.ctx.consulCurl(
          '/pdms/api/v1/model/tb_region/records',
          'pdms',
          'pdmsweb',
          {
            method: 'POST',
            data: {
              pageNo,
              pageSize,
              fields:
                'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
              filedOptions: [
                {
                  fieldName: 'region_id',
                  fieldValue: isNoRegionIds.join(','),
                  type: 'in'
                }
              ]
            }
          }
        )
        if (!result) {
          const error = new Error('pdms服务异常：result')
          throw error
        }
        if (result.status !== 200) {
          const error = new Error('根据区域名称搜索区域接口调用失败：result')
          error.status = result.status
          throw error
        }
        const res = bufferToJson(result.data)
        if (res.code !== '0') {
          const error = new Error(res.msg)
          throw error
        }
        const resRegion = handleData(res.data)
        regionList.rows = resRegion.rows.concat(regionList.rows)
      }
      // debugger
      return regionList
    }
    const result = await ctx.service.pdms.asyncRegionTreeSearch(ctx.request.query, this.transaction)
    return result
  }

  /**
   * 用户名userId获取该用户的有权限的组织
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async asyncOrgTreeByLimitByApp(params, userId) {
    const { ctx } = this
    const { parentId = -1, pageNo, pageSize } = params
    if (userId) {
      // 获取该用户有权限的组织列表
      const result = await ctx.service.pdms.getOrgByUserName(
        {
          pageNo,
          pageSize,
          userId,
          parentOrgId: parentId
        },
        this.transaction
      )
      return handleUserOrgTreeData(result)
    }
    const result = await ctx.service.pdms.asyncOrgTree(params, this.transaction)
    console.log('resultresultresultresult', result)
    for (const item of result.rows) {
      item.orgPathName = await this.ctx.service.pdms.treeOrgPath(
        item.orgPath || '',
        this.transaction
      )
    }
    return result
  }
  /**
   * 用户名userId获取该用户的有权限的组织
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async asyncOrgTreeByLimit() {
    const { ctx } = this
    const { parentId = -1, pageNo, pageSize } = ctx.request.query
    const userId = ctx.getUserId() || ctx.header.userids
    if (userId) {
      // 获取该用户有权限的组织列表
      const result = await ctx.service.pdms.getOrgByUserName(
        {
          pageNo,
          pageSize,
          userId,
          parentOrgId: parentId
        },
        this.transaction
      )
      return handleUserOrgTreeData(result)
    }
    const result = await ctx.service.pdms.asyncOrgTree(ctx.request.query, this.transaction)
    return result
  }
  /**
   * 根据组织名称获取该用户的有权限的组织_模糊查询
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async asyncOrgTreeSearchByLimit() {
    const { ctx } = this
    const { searchName, pageNo, pageSize } = ctx.request.query
    const userId = ctx.getUserId() || ctx.header.userids
    if (userId) {
      // 获取该用户有权限的组织列表
      const result = await ctx.service.pdms.getOrgLimitBySearchName(
        {
          userId,
          pageNo,
          pageSize,
          orgName: searchName
        },
        this.transaction
      )
      return handleUserOrgTreeData(result)
    }
    const result = await ctx.service.pdms.asyncOrgTreeSearch(ctx.request.query, this.transaction)
    return result
  }
  /**
   * 区域校验接口
   * @param {array} { userId }
   * @return {object|null} - 组织列表
   */
  @Transactional
  async regionMultiverify(params) {
    const { userId, regionIndexCodes } = params
    const result = await this.ctx.consulCurl(
      `/isupm/api/privilegeService/v1/regions/multiverify?privilegeCode=view&resourceType=region&userId=${userId}`,
      'isupm',
      'upm',
      {
        method: 'POST',
        data: regionIndexCodes
      }
    )
    if (!result) {
      const error = new Error('upm校验区域权限接口返回无数据')
      throw error
    }
    if (result && result.status && result.status !== 200) {
      const error = new Error('upm校验区域权限接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    return res.data
  }
  /**
   * 查询区域路径并且返回region_type
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */

  @Transactional
  async treePathAndEegionType(params = '', regionId = '') {
    // 传入的参数可能为空，为空时不能读取replace方法，会报错
    if (!params) {
      return ''
    }
    const reg = /^\@|\@$/g
    const _regionPathArr = params.replace(reg, '').split('@')
    const pageNo = 1
    const pageSize = 10000
    const result = await this.ctx.consulCurl(
      '/pdms/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        data: {
          pageNo,
          pageSize,
          fields:
            'model_data_id,parent_region_id,region_id,region_name,region_path,description,update_time,create_time,region_type',
          filedOptions: [
            {
              fieldName: 'region_id',
              fieldValue: _regionPathArr.join(','),
              type: 'in'
            }
          ]
        }
      }
    )
    if (!result) {
      const error = new Error('pmds服务异常')
      throw error
    }
    if (result.status !== 200) {
      const error = new Error('pmds模型数据查询接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const responseData = handleData(res.data)

    responseData.rows.sort((prev, next) => {
      return _regionPathArr.indexOf(prev.regionId) - _regionPathArr.indexOf(next.regionId)
    })

    const treePath = responseData.rows.map(item => {
      return item.regionName
    })
    if (regionId) {
      const regionType = responseData.rows.filter(res => regionId === res.regionId)
      return {
        regionPathName: bouncer(treePath).join('/'),
        regionType: regionType[0] ? regionType[0].regionType : ''
      }
    }
    return bouncer(treePath).join('/')
  }
}

module.exports = PdmsService
