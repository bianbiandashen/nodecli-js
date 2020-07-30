/* eslint-disable no-proto */

const Sequelize = require('sequelize')
require('reflect-metadata')
const Exception = require('../Exception')

module.exports = {
  Transactional(target, key, descriptor) {
    const func = descriptor.value

    descriptor.value = async function(...args) {
      let transaction
      let topLayer
      try {
        if (
          args.length >= 1 &&
          args[args.length - 1] &&
          args[args.length - 1].__proto__ &&
          args[args.length - 1].__proto__.constructor &&
          args[args.length - 1].__proto__.constructor.toString().match(/class\s(\w*)/) &&
          args[args.length - 1].__proto__.constructor.toString().match(/class\s(\w*)/)[1] ===
            'Transaction'
        ) {
          transaction = args[args.length - 1]
          topLayer = false
        } else {
          transaction = await this.app.model.transaction({ autocommit: true })
          topLayer = true
        }
      } catch (e) {
        throw new Error()
      }
      // idle in transaction
      try {
        // 传入app,如果需要可以继续传入ctx等,由于调用位置的关系,target内部的this无法获得所在class
        target.app = this.app
        target.ctx = this.ctx
        target.query = async function(modelName, queryName, params) {
          this.app.logger.debug('debug: -------modelName', modelName)
          this.app.logger.debug('debug: -------queryName', queryName)
          this.app.logger.debug('debug: -------params', params)
          // console.log('capitalizecapitalize', this.ctx)
          // console.log('debug: -------modelName', modelName)
          // console.log('debug: -------queryName', queryName)
          // console.log('debug: -------params', params)

          const appId = this.ctx.header.appid
          if (appId === undefined || appId === '') {
            throw new Error('请求header中缺失appId')
          }
          // 注入app供使用
          this.app.model[modelName + this.app.capitalize(appId)].query.app = this.app
          // 执行,跳入modelcapitalize
          try {
            return await this.app.model[modelName + this.app.capitalize(appId)].query[queryName](
              params,
              transaction,
              modelName + this.app.capitalize(appId)
            )
          } catch (e) {
            throw new Error(
              e.message +
                ';;modelName:' +
                modelName +
                this.app.capitalize(appId) +
                ';;queryName:' +
                queryName
            )
          }
        }
        // 传入transaction,用于手动commit
        target.transaction = transaction
        if (!topLayer) {
          args.splice(args.length - 1, 1)
        }
        const result = await func.apply(target, args)

        // 判断是否手动commit事务就是在service里面主动commit事务
        if (!transaction.finished && topLayer) {
          this.app.logger.debug('事务已经提交')
          await transaction.commit()

          console.log('Auto committed')
        }
        return result
      } catch (e) {
        // 回滚操作在异常捕获中统一处理,在service中手动throw错误也会在此处捕获,错误码默认500
        throw new Exception(e.message, (e.code = 500), transaction)
      }
    }
  },
  Model(target, key, descriptor) {
    const func = descriptor.value
    descriptor.value = async function(args, upperTransaction, modelName) {
      const transaction = upperTransaction
      try {
        target.app = this.app

        // 箭头方法继承this
        // 直接sql操作数据库
        target.query = async (queryString, opt = {}) => {
          // 向opt中注入transaction
          opt.transaction = transaction
          // 执行查询
          const result = await this.app.model.query(queryString, opt)
          return result
        }
        target.create = async (params, opt = {}) => {
          opt.transaction = transaction
          const result = await this.app.model[modelName].create(params, opt)
          return result
        }
        // conditions example  { where: {uuid: *** }}
        target.update = async (updateField, opt = {}) => {
          opt.transaction = transaction
          const result = await this.app.model[modelName].update(updateField, opt)
          return result
        }
        target.findAndCountAll = async (params, opt = {}) => {
          opt.transaction = transaction
          const result = await this.app.model[modelName].findAndCountAll(params, opt)
          return result
        }
        target.findAll = async (params, opt = {}) => {
          opt.transaction = transaction
          const result = await this.app.model[modelName].findAll(params, opt)
          return result
        }
        target.findOne = async (params, opt = {}) => {
          opt.transaction = transaction
          const result = await this.app.model[modelName].findOne(params, opt)
          return result
        }
        // conditions example  { where: {uuid: *** }}
        target.destroy = async (params, opt = {}) => {
          opt.transaction = transaction
          const result = await this.app.model[modelName].destroy(params, opt)
          return result
        }
        target.count = async (params, opt = {}) => {
          opt.transaction = transaction
          const result = await this.app.model[modelName].count(params, opt)
          return result
        }
        target.bulkCreate = async (params, opt = {}) => {
          if (Array.isArray(params)) {
            opt.transaction = transaction
            const result = await this.app.model[modelName]
              .bulkCreate(params, opt)
              .catch(Sequelize.ConnectionError, () => {
                transaction.rollback()
              })
            return result
          }
          throw new Exception('批量插入请传入数组', 500, transaction)
        }

        // 执行方法
        const result = await func.apply(target, args)

        return result
      } catch (e) {
        throw new Exception(e.message, 500, transaction)
      }
    }
  }
}
