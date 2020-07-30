/*
 * @作者: bianlian
 * @创建时间: 2019-12-10 20:47:07
 * @Last Modified by: bainlian
 * @Last Modified time: 2020-02-24 19:45:50
 */
// 任务巡检项表
'use strict'

module.exports = app => {
  const { STRING, DATE, UUIDV1 } = app.Sequelize
  const moment = require('moment')
  return {
    testId: {
      type: STRING(48),
      allowNull: false,
      primaryKey: true,
      defaultValue: UUIDV1,
      field: 'test_id',
      comment: '测试id 唯一值'
    },
    updateTime: {
      type: DATE,
      field: 'update_time',
      allowNull: false,
      comment: '最后一次操作时间'
    },
    createTime: {
      type: DATE,
      allowNull: false,
      field: 'create_time',
      comment: '创建时间'
    }
  }
}
