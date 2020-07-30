/*
 * @作者: bianlian
 * @创建时间: 2019-12-25 15:16:45
 * @Last Modified by: renxiaojian
 * @Last Modified time: 2020-06-22 14:16:00
 */

'use strict'

const Service = require('egg').Service
const UUID = require('uuid')
const { Transactional } = require('../core/transactionalDeco')
const Sequelize = require('sequelize')
const { Op } = Sequelize
const FormStream = require('formstream')
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
class CommonService extends Service {
  @Transactional
  async getItemManner() {
    const { ctx } = this
    const result = await ctx.service.itemEvent.getItemManner(ctx.request.query, this.transaction)
    return result
  }
  @Transactional
  async getItemMannerByTaskItemId(params) {
    const { ctx } = this
    ctx.query.taskItemId = params.taskItemId
    const result = await ctx.service.patrolTaskItem.getItemManner(
      ctx.request.query,
      this.transaction
    )
    return result
  }
  @Transactional
  async getUserInfo() {
    const context = 'patrolengine'
    const userid = this.ctx.session.cas.userinfo.split('&&')[0]
    const language = this.ctx.session.cas.userinfo.split('&&')[5]
    const skin = this.app.getConfigProperoty('@framework.web.skin')

    const productTions = await this.ctx.consulCurl(
      '/productService/v1/products',
      'centerService',
      'centerService',
      {
        method: 'GET'
      }
    )
    this.app.resDataTrans(productTions)

    const productTionARR = productTions.data.data.list

    // licenseModel: 'Infovision_iSee',
    // productFeature: 'neutral',
    // productId: 'Infovision iWork-Safety (DN)',
    // productVersion: 'V1.1.100_20200310.20200304174430',
    // releaseScope: 'domestic'
    console.log('productTionARRproductTionARR', productTionARR)
    const productId = productTionARR && productTionARR.length > 0 && productTionARR[0].productId

    const menuList = await this.ctx.consulCurl(
      // '/api/privilegeService/v1/menus/list?userId=' + userid + '&type=1&componentId=' + context,
      '/api/privilegeService/v1/menus/list?userId=' + userid + '&type=1',
      'upm',
      'upm',
      {
        method: 'GET'
      }
    )
    this.app.resDataTrans(menuList)
    const breadcrumb = await this.ctx.consulCurl(
      '/menuService/v1/menus?type=1&language=' + language,
      'centerService',
      'centerService',
      {
        method: 'GET'
      }
    )
    this.app.resDataTrans(breadcrumb)

    const data = {}
    const humpMenuList = []
    const meunListARR = menuList.data.data.list
    // edit by biabian
    let productMenu
    if (productId) {
      productMenu = meunListARR.find(ele => ele.indexOf(`${productId}_`) >= 0)
    }
    if (productMenu) {
      for (const item of menuList.data.data.list) {
        if (item.indexOf(`${productId}_`) >= 0) {
          const shortHump = toHump(item.substr(`${productId}_`.length))
          humpMenuList.push('patrolengine-app_' + shortHump)
          data[shortHump] = []
          getMenuName(item.substr(`${productId}_`.length), shortHump)
        } else if (item.indexOf('patrolengine_') >= 0) {
          const shortHump = toHump(item.substr('patrolengine_'.length))
          humpMenuList.push('patrolengine-app_' + shortHump)
          data[shortHump] = []
          getMenuName(item.substr('patrolengine_'.length), shortHump)
        }
      }
    } else {
      for (const item of menuList.data.data.list) {
        const shortHump = toHump(item.substr(13))
        humpMenuList.push('patrolengine-app_' + shortHump)
        data[shortHump] = []
        getMenuName(item.substr(13), shortHump)
      }
    }

    function toHump(k) {
      const hump = k.replace(/\_(\w)/g, function(all, letter) {
        return letter.toUpperCase()
      })
      return hump
    }

    function getMenuName(menuid, origin) {
      for (const item of breadcrumb.data.data.list) {
        if (item.menuId === menuid && item.menuId !== 'menu_app') {
          data[origin].unshift(item.name)
          if (item.parentId) {
            getMenuName(item.parentId, origin)
          }
          return
        }
        if (item.componentMenuId === menuid && item.componentMenuId !== 'menu_app') {
          data[origin].unshift(item.name)
          if (item.parentId) {
            getMenuName(item.parentId, origin)
          }
          return
        }
        if (item.productMenuCode === menuid && item.productMenuCode !== 'menu_app') {
          data[origin].unshift(item.name)
          if (item.parentId) {
            getMenuName(item.parentId, origin)
          }
          return
        }
      }
    }
    return {
      languageId: language,
      skin: this.app.getConfigProperoty('@framework.web.skin'),
      breadcrumb: data,
      code: humpMenuList,
      userId: userid
    }
  }
  @Transactional
  async getPersonInfo() {
    const { ctx } = this
    const userId = ctx.getUserId()
    if (!userId) throw new Error('用户名不存在')
    const result = await this.ctx.consulCurl('/isupm/api/userService/v1/user', 'isupm', 'upm', {
      method: 'POST',
      data: {
        userIds: [userId]
      }
    })
    if (!result) {
      const error = new Error('isupm服务异常')
      throw error
    }
    if (result.status !== 200) {
      const error = new Error('isupm数据查询接口调用失败')
      error.status = result.status
      throw error
    }
    const res = bufferToJson(result.data)
    if (res.code !== '0') {
      const error = new Error(res.msg)
      throw error
    }
    const userInfo = res.data.list[0]
    const _personId = userInfo.personId
    let personInfo
    let orgInfo
    if (_personId) {
      const psersonData = await this.ctx.consulCurl(
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
                fieldValue: userInfo.personId,
                type: 'eq'
              }
            ]
          }
        }
      )
      if (!psersonData) {
        const error = new Error('pdms模型数据查询接口返回无数据')
        throw error
      }
      if (psersonData && psersonData.status && psersonData.status !== 200) {
        const error = new Error('pdms模型数据查询接口调用失败')
        error.status = psersonData.status
        throw error
      }
      const personRes = bufferToJson(psersonData.data)
      if (personRes.code !== '0') {
        const error = new Error(personRes.msg)
        throw error
      }
      personInfo = personRes && personRes.data && personRes.data.list && personRes.data.list[0]
      if (personInfo && personInfo.org_id) {
        const orgMultiverify = await this.ctx.consulCurl(
          `/isupm/api/privilegeService/v1/regions/multiverify?privilegeCode=view&resourceType=region&userId=${userId}`,
          'isupm',
          'upm',
          {
            method: 'POST',
            data: [personInfo.org_id]
          }
        )
        if (!orgMultiverify) {
          const error = new Error('upm查询用户有权限的区域接口返回无数据')
          throw error
        }
        if (orgMultiverify && orgMultiverify.status && orgMultiverify.status !== 200) {
          const error = new Error('用户名获取该用户的有权限的区域接口调用失败')
          error.status = orgMultiverify.status
          throw error
        }
        const orgStatusRes = bufferToJson(orgMultiverify.data)
        if (orgStatusRes.code !== '0') {
          const error = new Error(orgStatusRes.msg)
          throw error
        }
        const orgData = await this.ctx.consulCurl(
          '/pdms/api/v1/model/tb_org/records',
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
                  fieldName: 'org_id',
                  fieldValue: personInfo.org_id,
                  type: 'eq'
                }
              ]
            }
          }
        )
        if (!orgData) {
          const error = new Error('pdms模型数据查询接口返回无数据')
          throw error
        }
        if (orgData && orgData.status && orgData.status !== 200) {
          const error = new Error('pdms模型数据查询接口调用失败')
          error.status = orgData.status
          throw error
        }
        const orgRes = bufferToJson(orgData.data)
        if (orgRes.code !== '0') {
          const error = new Error(orgRes.msg)
          throw error
        }
        orgInfo = orgRes && orgRes.data && orgRes.data.list && orgRes.data.list[0]
        orgInfo.orgStatus = orgStatusRes && orgStatusRes.data.total === 1 ? 1 : 0
      }
    }
    userInfo.orgId = personInfo ? personInfo.org_id : ''
    userInfo.orgPath = personInfo ? personInfo.org_path : ''
    userInfo.orgName = orgInfo ? orgInfo.org_name : ''
    userInfo.parentOrgId = orgInfo ? orgInfo.parent_org_id : ''
    userInfo.orgStatus = orgInfo ? orgInfo.orgStatus : ''
    return userInfo
  }
  @Transactional
  async uploadPicToAsw(fileStream, taskPointId, cameraId) {
    const { ctx } = this
    const picName = UUID.v1() + '.jpg'
    // const appId = ctx.header.appid
    this.ctx.hikLogger.info('请求asw上传图片/patrolengine-engine/api/v1/asw/upload')
    this.ctx.hikLogger.info('请求asw参数')
    this.ctx.hikLogger.info(fileStream)
    this.ctx.hikLogger.info(picName)
    const res = await this.ctx.consulCurl(
      '/patrolengine-engine/api/v1/asw/upload',
      'patrolengine',
      'patrolengine-engine',
      {
        headers: {
          appId: this.ctx.header.appid
        },
        useHttp: true,
        method: 'POST',
        file: {
          name: 'file',
          fileStream,
          fileName: picName,
          type: 'stream'
        }
        // dataType: 'json'
      }
    )
    this.app.resDataTrans(res)
    // console.log('图片系统错误图片系统错误图片系统错误', res)
    this.ctx.hikLogger.info('请求asw回来的参数')
    this.ctx.hikLogger.info(res.data)
    if (res.data.code !== '0') {
      throw Error('图片系统错误' + res.data.msg)
    }
    // const res = await this.app.curl('http://10.15.66.13:8088/patrolengine-engine/api/v1/asw/upload', {
    //   method: 'POST',
    //   stream: form,
    //   headers: {
    //     'content-type': 'multipart/form-data;boundary=' + form._boundary
    //   },
    //   dataType: 'json'
    // })

    // const res = await this.ctx.consulCurl('/patrolengine/api/v1/asw/upload', 'patrolengine', 'patrolengine-app', {
    // method: 'POST',
    // stream: form,
    // headers: { 'content-type': 'multipart/form-data;boundary=' + form._boundary },
    // dataType: 'json'
    // })
    const responseData = {}
    responseData.picUrl = res && res.data && res.data.data

    if (res.data.data) {
      const params = {
        picUrl: res.data.data,
        taskPointId,
        cameraId
      }
      console.log('paramsparams', params)
      responseData.picId = await ctx.service.common.uploadImgToDb(params, this.transaction)
    }

    return responseData
  }

  /**
   * 获取视频app要的参数的接口-自定义
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getCameraObj(params = {}) {
    const { app } = this
    const { cameraId } = params

    const regionData = await app.consulCurl(
      '/pdms/api/v1/model/tb_camera/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        useHttp: true,
        data: {
          pageNo: 1,
          pageSize: 10000,
          fields:
            'decode_tag,camera_name,region_id,camera_id,device_id,channel_type,channel_no,camera_name',
          filedOptions: [
            {
              fieldName: 'camera_id',
              fieldValue: cameraId,
              type: 'eq'
            }
          ]
        }
      }
    )

    console.log('tb_cameratb_camera', regionData && bufferToJson(regionData.data))
    const data = regionData && bufferToJson(regionData.data)
    return data || []
  }
  /**
   * 添加接口-自定义
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async uploadImgToDb(params = {}) {
    const { ctx } = this
    const { picUrl, taskPointId, cameraId } = params
    const picId = ctx.helper.uuidv1() // picId
    params.picId = picId
    const result = await this.query('PatrolPic', 'createData', [params])
    if (result) {
      return picId
    }
  }

  /**
   * 根据某一级的区域找到所有的下面区域的ids集合-自定义
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getRegionIdsFromFirstRegion(regionId) {
    const regionList = await this.ctx.consulCurl(
      '/api/v1/model/tb_region/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        useHttp: true,
        data: {
          pageNo: 1,
          pageSize: 10000,
          fields: 'region_id',
          filedOptions: [
            {
              fieldName: 'region_path',
              fieldValue: regionId,
              type: 'like'
            }
          ]
        }
      }
    )
    const regionIds = bufferToJson(regionList.data)
    return regionIds.data.list
  }

  /**
   * 添加接口-自定义
   * @param {object}
   * @return {string} - object
   */
  @Transactional
  async getImageUrlForBS(picId) {
    // picid兼容图片id和图片url短路径
    const res = await this.ctx.service.picture.getRealPic(picId, this.transaction)
    // 去掉url前缀
    let realUrl
    if (typeof res === 'string') {
      // if (this.app.env === 'prod') {
      // 图片更改路径
      // realUrl = res && '/pic?' + res.split('/pic?')[1]
      realUrl = res
      // } else {
      //   realUrl = res
      // }
    } else if (res && res.picUrl) {
      // if (this.app.env === 'prod') {
      // 图片更改路径
      // realUrl = res && res.picUrl && '/pic?' + res.picUrl.split('/pic?')[1]
      realUrl = res.picUrl
      // } else {
      //   realUrl = res.picUrl
      // }
      res.picUrl = realUrl
      return res
    } else {
      return null
    }
    return realUrl
  }

  @Transactional
  async getUserList(params = {}) {
    const { ctx } = this
    const { regionId } = ctx.request.query
    let userIds // 用户id集合
    // let userInfoList // 用户信息集合
    let personInfoList // 人员信息集合
    // 根据区域ID获取该区域的用户id列表集合
    const userIdsList = await this.ctx.consulCurl(
      '/isupm/api/userService/v1/users',
      'isupm',
      'upm',
      {
        method: 'POST',
        data: {
          pageNo: 1,
          pageSize: 100,
          resourceType: 'region'
        }
      }
    )

    userIds = bufferToJson(userIdsList.data)
    let userInfoList = userIds.data.list
    // 获取用户列表信息列表
    const personIds = dedupe(bouncer(userInfoList.map(item => item.personId)))
    // 获取用户关联的人员信息列表
    let personList
    if (personIds.length > 0) {
      personList = await ctx.service.pdms.getPersonsByPersonIds(
        {
          personIds: personIds.join(','),
          pageNo: 1,
          pageSize: 1000
        },
        this.transaction
      )
      personInfoList = personList.list
    } else personInfoList = []
    // 合并用户关联的人员信息
    userInfoList = userInfoList.map(item => {
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
    return userInfoList
  }

  // 找到相同组织下的其他用户
  @Transactional
  async getUserListInSameOrg(params = {}, userId) {
    const { pageNo, pageSize, patrolObjectId } = params

    const userIds = []

    userIds.push(userId)
    console.log('userIdsuserIds', userIds)
    // 获取用户列表信息列表
    const userList = await this.ctx.consulCurl('/isupm/api/userService/v1/user', 'isupm', 'upm', {
      method: 'POST',
      data: {
        userIds
      }
    })

    const userInfo = bufferToJson(userList.data).data
    if (!userInfo || userInfo.list.length <= 0) {
      const resultList = {}
      resultList.list = []
      return resultList
    } else if (!userInfo.list[0].personId) {
      const resultList = {}
      resultList.list = []
      return resultList
    }
    // 下一步 通过userinfo 的 person_id
    const personIdByUserId = userInfo.list[0].personId
    // 因为 现在一个人有且仅关联一个组织
    const parnetOrgData = await this.ctx.consulCurl(
      '/api/v1/model/tb_person/records',
      'pdms',
      'pdmsweb',
      {
        method: 'POST',
        useHttp: true,
        data: {
          pageNo: 1,
          pageSize: 1,
          fields: 'org_path',
          filedOptions: [
            {
              fieldName: 'person_id',
              fieldValue: personIdByUserId,
              type: 'eq'
            }
          ]
        }
      }
    )
    this.app.resDataTrans(parnetOrgData)
    if (
      !parnetOrgData ||
      parnetOrgData.data.data.list.length <= 0 ||
      !parnetOrgData.data.data.list[0].org_path
    ) {
      throw Error('用户对应组织信息不存在')
    } else {
      let likePath = ''
      if (patrolObjectId) {
        const patrolObjIdCondition = {
          patrolObjId: patrolObjectId
        }
        const PatrolObj = await this.query('PatrolObj', 'queryDataById', [patrolObjIdCondition])
        likePath = PatrolObj && PatrolObj.regionPath
      } else {
        likePath = parnetOrgData.data.data.list[0].org_path
      }

      console.log('likePathlikePathlikePath', likePath)
      const personListInSameOrg = await this.ctx.consulCurl(
        '/api/v1/model/tb_person/records',
        'pdms',
        'pdmsweb',
        {
          method: 'POST',
          useHttp: true,
          data: {
            pageNo: 1,
            pageSize: 999,
            fields: 'org_path, name, mobile, person_id',
            filedOptions: [
              {
                fieldName: 'org_path',
                fieldValue: likePath,
                type: 'like'
              }
            ]
          }
        }
      )

      this.app.resDataTrans(personListInSameOrg)
      const result =
        personListInSameOrg &&
        personListInSameOrg.data &&
        personListInSameOrg.data.data &&
        personListInSameOrg.data.data.list

      console.log('personListInSameOrg', result)
      // 找到下级组织，然后遍历组织找到人员，在根据人员ID找user
      let personIdList = []
      if (result && result.length > 0) {
        personIdList = result.map(ele => ele.person_id)
      }

      const userList = await this.ctx.service.pdms.getUserListByPersonIds(
        personIdList,
        this.transaction
      )
      const resultList = {}
      resultList.list = []
      for (const item of result) {
        const currentInfo = userList.list.find(v => v.personId === item.person_id)
        if (currentInfo) {
          item.orgName = await this.ctx.service.pdms.treeOrgPath(
            item.org_path || '',
            this.transaction
          )
          delete item.org_path
          delete item.person_type
          delete item.stu_start_time
          delete item.stu_end_time
          if (item.user_id !== userId) {
            resultList.list.push(
              Object.assign({}, item, {
                userId: currentInfo.userId,
                userName: currentInfo.userName,
                personName: currentInfo.personName,
                roleNames: currentInfo.roleNames
              })
            )
          }
        }
      }
      return resultList
    }
  }

  /**
   * 获取人员姓名 入参 userId ，分割
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */

  @Transactional
  async getUserInfoByUserIds(params = {}) {
    const { ctx } = this
    const { userIds } = params
    let userIdsList = []

    if (!userIds) {
      throw new Error('请检查用户id是否存在')
    }
    if (userIds.indexOf(',') >= 0) {
      userIdsList = userIds.split(',')
    } else {
      userIdsList.push(userIds)
    }
    if (userIdsList && userIdsList.length > 0) {
      const res = await ctx.service.pdms.getUsersByUserIds(userIdsList, this.transaction)
      if (res && res.list && res.list.length > 0) {
        const personIds = bouncer(res.list.map(item => item.personId))
        const personList = await ctx.service.pdms.getPersonsByPersonIds(
          {
            personIds: personIds.join(','),
            userIds
          },
          this.transaction
        )
        const userResult = []
        for (const item of res.list) {
          const obj = {}
          const currentPerson = personList.list.find(v => v.person_id === item.personId)
          if (currentPerson) {
            obj.userId = item.userId
            obj.phoneNo = currentPerson.mobile
            obj.personName = currentPerson.name
            obj.orgPathName = await this.ctx.service.pdms.treeOrgPath(
              currentPerson.org_path || '',
              this.transaction
            )
          } else {
            obj.userId = item.userId
            obj.phoneNo = null
            obj.personName = null
            obj.orgPathName = null
          }
          userResult.push(obj)
        }
        console.log('userResultuserResult', userResult)
        const res1 = {}
        res1.list = userResult
        res1.total = userResult.length
        return res1
      }
    }
  }
  /*
   * 查询区域路径
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */

  @Transactional
  async partrolItemsPath(params = {}) {
    const reg = /^\@|\@$/g

    const _PathArr = params.replace(reg, '').split('@')

    const condition = {
      limit: 100,
      offset: 0,
      where: {
        itemId: {
          [Op.or]: _PathArr
        }
      },
      raw: true
    }
    const result = await this.query('PatrolItem', 'queryTreePathData', [condition])

    // const sortFunc = (propName, referArr) => {
    //   return (prev, next) => {
    //     return referArr.indexOf(prev[propName]) - referArr.indexOf(next[propName])
    //   }
    // }
    // 2. 排序objArr
    result.list.sort((prev, next) => {
      return _PathArr.indexOf(prev.itemId) - _PathArr.indexOf(next.itemId)
    })

    const treePath = result.list.map(item => {
      return item.itemContent
    })
    return treePath.join('/')
  }

  /**
   * 查询任务巡检项下的patrolresult列表
   * @param {object} { params } - 条件
   * @return {object|null} - 查找结果
   */
  @Transactional
  async getPatrolResultByTaskItemId(params = {}) {
    const condition = {
      where: {
        patrolTaskItemId: params.patrolTaskItemId
      }
    }
    const data = await this.query('PatrolTaskItem', 'findOneData', [condition])
    const objTypeId = data && data.objTypeId
    const objTypeIdCon = {
      where: {
        objTypeId,
        isDelete: 0
      },
      attributes: ['orId', 'orName', 'triggerNext', 'order']
    }
    const PatrolObjTypeRes = await this.query('ObjTypeResult', 'findAndCountAllData', [
      objTypeIdCon
    ])
    return PatrolObjTypeRes
  }
  @Transactional
  async getPatrolPic(params) {
    const result = await this.query('PatrolPic', 'getPicById', [params])
    return result
  }
}

module.exports = CommonService
