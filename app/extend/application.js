'use strict'
// const _ = require('lodash');
// const fecha = require('fecha');

// // TODO Redis好像无法对消息持久化存储，这个到时候再看下怎么改进
// const handlers = {}; // 任务处理器map
// const events = {}; // 任务类型map
// const tasks = {}; // 任务列表
// const delayEventKeyPrefix = 'delay_event_'; // 定时任务key前缀
// const VERSION = '1.0'; // 定时任务key前缀
// const TRANSITION = Symbol('Application#transition');
const moment = require('moment')
const regularStr = /\'|\/|\\|\*|\?|"|<|>|\|/
// module.exports = {
function decodeCommonBase64String (str) {
  // if (this.config.env === 'prod') {
  const b = Buffer.from(str, 'base64')
  return b.toString()
  // }
  // return str
}
function encodeBase64 (str) {
  return Buffer.from(str).toString('base64')
}
function dateFormatter (date, fmt) {
  if (!date) {
    return ''
  }
  try {
    const o = {
      'M+': date.getMonth() + 1, // 月份
      'd+': date.getDate(), // 日
      'h+': date.getHours(), // 小时
      'm+': date.getMinutes(), // 分
      's+': date.getSeconds(), // 秒
      'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
      S: date.getMilliseconds() // 毫秒
    }
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
        )
      }
    }
    return fmt
  } catch (e) {
    return date
  }
}
function toHumpJson (jsonList) {
  const result = []
  for (const index in jsonList) {
    const item = {}
    for (const k in jsonList[index]) {
      const hump = k.replace(/\_(\w)/g, function (all, letter) {
        return letter.toUpperCase()
      })
      item[hump] = jsonList[index][k]
    }
    result.push(item)
  }
  return result
}
function formatToDayTime (date = new Date()) {
  return moment(date).format('YYYY-MM-DD HH:mm:ss')
}
function creatDataInfo () {
  return { updateTime: this.formatToDayTime(),
    createTime: this.formatToDayTime() }
}
function Utf8ArrayToStr (array) {
  let out,
    i,
    c
  let char2,
    char3

  out = ''
  const len = array.length
  i = 0
  while (i < len) {
    c = array[i++]
    // eslint-disable-next-line no-bitwise
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c)
        break
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++]
        // eslint-disable-next-line no-bitwise
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f))
        break
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++]
        char3 = array[i++]
        out += String.fromCharCode(
          // eslint-disable-next-line no-bitwise
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        )
        break
      default:
    }
  }
  return out
}
function Uint8ArrayToString (fileData) {
  let dataString = ''
  for (let i = 0; i < fileData.length; i++) {
    dataString += String.fromCharCode(fileData[i])
  }

  return dataString
}
function resDataTrans (resp) {
  if (resp && resp.data) {
    if (Buffer.isBuffer(resp.data)) {
      resp.data = JSON.parse(this.Utf8ArrayToStr(resp.data))
    }
    if (Buffer.isBuffer(resp.res.data)) {
      resp.res.data = JSON.parse(this.Utf8ArrayToStr(resp.res.data))
    }
  }
}
function capitalize ([ first, ...rest ], lowerRest = false) {
  if (!first) {
    return ''
  }
  return first.toUpperCase() + (lowerRest ? rest.join('').toLowerCase() : rest.join(''))
}
function getConfigProperoty (key) {
  if (this._configProp) {
    const valueList = this._configProp.filter(d => d.indexOf(key) > -1)
    if (valueList && valueList.length > 0) {
      return valueList[0].substring(valueList[0].indexOf('=') + 1)
    }
    this.logger.warn(key + " does't has the value")
    return ''
  }
  this.logger.warn('configProp [' + key + '] is undefined,please check config.properties')
  return undefined
}
function formatChar (data = {}) {
  let switchData = true
  Object.values(data).forEach(res => {
    if (typeof res === 'string') {
      if (regularStr.test(res)) {
        switchData = false
      }
    } else if (typeof res === 'object' && res !== null) {
      switchData = this.formatChar(res)
    }
  })
  return switchData
}
// 过滤对象中的某些属性
function filterObj (obj, arr) {
  if (typeof (obj) !== 'object' || !Array.isArray(arr)) {
    throw new Error('参数格式不正确')
  }
  const result = {}
  Object.keys(obj).filter(key => !arr.includes(key)).forEach(key => {
    result[key] = obj[key]
  })
  return result
}
// 数组对象去重
function arrayToDistinct (array, field) {
  const obj = {}
  array = array.reduce((cur, next) => {
    obj[next[field]] ? '' : obj[next[field]] = true && cur.push(next)
    return cur
  }, [])// 设置cur默认类型为数组,并且初始值为空的数组
  return array
}
function findNodes (node, tree, option = {
  id: 'id',
  parentId: 'parentId',
  rootId: 'root',
  childrenField: 'children',
  direction: 0
}) {
  let resultNodes = []
  if (!node || !Array.isArray(node)) {
    return
  }
  for (let i = 0; i < node.length; i++) {
    const allParentNodes = findAllNodes(node[i], tree, [], 0, option)
    resultNodes = resultNodes.concat(allParentNodes)
  }
  resultNodes = arrayToDistinct(resultNodes, option.id)
  return resultNodes
}
function findAllNodes (node, tree, parentNodes = [], index = 0, option) {
  if (!node || node[option.parentId] === option.rootId && option.direction === 0) {
    return []
  }
  findTargetNodes(node, parentNodes, tree, option)
  const parentNode = parentNodes[index]
  findAllNodes(parentNode, tree, parentNodes, ++index, option)
  return parentNodes
}
function findTargetNodes (node, parentNodes, tree, option) {
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    if (option.direction === 0) {
      if (item[option.id] === node[option.parentId]) {
        parentNodes.push(filterObj(item, [ option.childrenField ]))
        return
      }
    } else {
      if (item[option.parentId] === node[option.id]) {
        parentNodes.push(filterObj(item, [ option.childrenField ]))
      }
    }
    if (item.children && item.children.length > 0) {
      findTargetNodes(node, parentNodes, item.children, option)
    }
  }
}
// 数组转树结构，递归
function toTree (list, parId, parentId = 'parentId', id = 'id') {
  const len = list.length
  function loop (parId) {
    const res = []
    for (let i = 0; i < len; i++) {
      const item = list[i]
      if (item[parentId] === parId) {
        item.children = loop(item[id])
        res.push(item)
      }
    }
    return res
  }
  return loop(parId)
}
/**
   * 树转数组扁平化结构
   * 深度优先遍历  递归
   */
function deepTraversal (data) {
  const result = []
  data.forEach(item => {
    const loop = data => {
      result.push(exports.filterObj(data, [ 'children' ]))
      const child = data.children
      if (child) {
        for (let i = 0; i < child.length; i++) {
          loop(child[i])
        }
      }
    }
    loop(item)
  })
  return result
}
// }

module.exports = {
  decodeCommonBase64String,
  encodeBase64,
  dateFormatter,
  toHumpJson,
  formatToDayTime,
  creatDataInfo,
  Utf8ArrayToStr,
  Uint8ArrayToString,
  resDataTrans,
  capitalize,
  getConfigProperoty,
  formatChar,
  filterObj,
  arrayToDistinct,
  findNodes,
  toTree,
  deepTraversal
}
