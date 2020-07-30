/*
 * @Author: songxiaodong5
 * @Date: 2020-2-23 0:32
 * @Last Modified by: jiangyan6
 * @Last Modified time: 2020-03-27 10:09:28
 */
'use strict'
const Service = require('egg').Service
const { Transactional } = require('../core/transactionalDeco')
const Sequelize = require('sequelize')
const { decryption } = require('hikidentify')
const { Op } = Sequelize

function _getConfigProperoty(key) {
  if (this.app._configProp) {
    const valueList = this.app._configProp.filter(d => d.indexOf(key) > -1)
    if (valueList && valueList.length > 0) {
      return valueList[0].substring(valueList[0].indexOf('=') + 1)
    }
    this.app.logger.warn(key + " does't has the value")
    return key
  }
  this.app.logger.warn('configProp [' + key + '] is undefined,please check config.properties')
  return key
}

function bufferToJson(data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {}
}

function _decrypt(val) {
  return decryption(val)
}
const moment = require('moment')
class tlncService extends Service {
  @Transactional
  async mq(params) {
    // const Stomp = require('stomp-client')
    // const ip = _getConfigProperoty.call(this, 'patrolengine-queue.1.@parent.@ip')
    // const port = _getConfigProperoty.call(this, 'patrolengine-queue.1.@parent.port')
    // const username = _getConfigProperoty.call(this, 'patrolengine-queue.1.@parent.@username')
    // const password = _decrypt(
    //   _getConfigProperoty.call(this, 'patrolengine-queue.1.@parent.@password')
    // )
    const destination = '/topic/tlnc.tlncweb.topic.receive.msg'
    //const client = new Stomp(ip, port, username, password)
    const client = this.app.tlncClient
    const uuidv1 = require('uuid/v1')()
    const nowDate = moment(new Date(), 'YYYY-MM-DD HH:mm:ss')
    const {
      userId,
      listType,
      msgStatus,
      extendJson = '',
      msgTitle,
      moduleId,
      msgId,
      msgDetail,
      extendNoShow
    } = params
    let value = {}
    // 代办
    if (listType === 'todo') {
      value = {
        listType, // 代办的特殊标识
        params: {
          msgs: [
            {
              operType: '1', // 暂无说明
              comId: 'patrolengine', // app 写死
              moduleId, // 暂无说明
              uid: userId, //  userid
              msgId, //
              msgStatus, // app 写死
              msgTitle, //
              msgTime: this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss'),
              extendStr: {
                showFlag: 1,
                picUrl: '',
                extendJson,
                extendNoShow
              }
            }
          ]
        }
      }
    } else if (listType === 'message') {
      // 消息
      value = {
        listType,
        operType: 'add',
        params: [
          {
            uids: userId,
            moduleId,
            comId: 'patrolengine',
            msgs: [
              {
                msgId,
                msgTitle,
                // msgStatus,
                msgStatusStr: '',
                msgDetail,
                msgTime: this.app.dateFormatter(new Date(), 'yyyy-MM-dd hh:mm:ss'),
                extendStr: {
                  showFlag: 1,
                  picUrl: '',
                  extendJson,
                  extendNoShow
                }
              }
            ]
          }
        ]
      }
    }

    console.log('valuevaluevaluevalue', JSON.stringify(value))
    if (msgId) {
      client.publish(destination, JSON.stringify(value))
    }
  }
  @Transactional
  async tlncDel(params) {}
}
module.exports = tlncService
