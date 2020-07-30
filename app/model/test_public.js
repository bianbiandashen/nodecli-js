'use strict'

module.exports = app => {
  const { model, Sequelize } = app
  // 单应用跨组件时需要配置这些ｓｃｈｅｍａ,比如变电站场景ｅｒｉｓ，社区场景等..
  const schema = 'public'
  const testSchema = require('../schema/tb_test')(app)
  const Test = model.define('tb_test', testSchema, {
    schema
  })
  const { Model } = require('../core/transactionalDeco/index.js')
  const { Op } = Sequelize
  // PatrolObjRel.associate = function () {
  //   PatrolObjRel.belongsTo(app.model.PatrolObj, {
  //     foreignKey: 'patrolObjId',
  //     targetKey: 'patrolObjId',
  //     as: 'partrolObjItem'
  //   })
  // }
  class Query {
    // @Model
    // async queryDataById1(params) {
    //   const {
    //     userId
    //   } = params
    //   const res = await this.query(`
    //   SELECT * FROM ` + schema + `.tb_agent_person where end_time > now()
    //   AND IS_DELETE = 0
    //   AND recovery_status = 0
    //   AND submitter_user_id = $userId`, {
    //     bind: {
    //       userId,
    //       isDelete: 0,
    //       recoveryStatus: 0
    //     }
    //   })

    //   return this.app.toHumpJson(res[0])
    // }

    /**
     * 通过id查询列表
     * @param {object} { params } - 条件
     * @return {object|null} - 查找结果
     */

    @Model
    async queryDataById(params) {
      const data = await this.findAndCountAll(params)
      const result = {
        total: data.count,
        list: data.rows
      }
      return result
    }
  }
  Test.query = new Query()
  return Test
}
