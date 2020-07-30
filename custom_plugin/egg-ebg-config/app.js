/* eslint-disable prefer-const */
const fs = require('fs')
const { decryption } = require('hikidentify')
// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录

class AppBootHook {
  constructor (app) {
    this.app = app
    this.configLogObj = {}
    this._configProp
    this._serviceDirAddr
    // Agent Worker(mq)
    this.agentFun()
    // Agent Worker(巡检对象同步)
    this.agentPatrolObjAsyncFun()
  }
  agentPatrolObjAsyncFun () {
    try {
      const _this = this
      const app = this.app
      // 同步十次每次等待3分钟
      const length = 10
      const time = 180000
      app.messenger.on('patrol_async_action', async () => {
        const ctx = await _this.app.createAnonymousContext()
        for (let i = 0; i < length; i++) {
          try {
            _this.app.hikLogger.info('巡检对象同步成功')
            await ctx.service.patrolObj.asyncPatrolService()
            break
          } catch (e) {
            // 捕获巡检对象同步抛异常，避免系统崩溃
            _this.app.hikLogger.info('巡检对象同步失败')
            _this.app.hikLogger.info(e)
            _this.app.hikLogger.info(i)
            await new Promise(res => {
              setTimeout(function () {
                res()
              }, time)
            })
          }
        }
      })
    } catch (error) {
      this.app.hikLogger.info('连接mq失败同步巡检对象' + error)
    }
  }
  agentFun () {
    try {
      const app = this.app
      app.messenger.on('mq_action', data => {
        const _this = this
        const {
          ip, port, username, password
        } = data
        const Stomp = require('stomp-client')
        // 记录日志-启动
        this.app.hikLogger.info(ip, port, username, decryption(password))
        const destination = '/topic/patrolengine.patrolengine-queue.topic.task'
        // const client2 = new Stomp(ip, port, username, decryption(password))
        // client2.connect(function(sessionId) {})
        // this.app.tlncClient = client2
        const client = new Stomp(ip, port, username, decryption(password))
        client.connect(
          async function (sessionId) {
            client.subscribe(destination, async body => {
              try {
                _this.app.hikLogger.info('代办消息发送' + body)
                const bodyJson = JSON.parse(body)
                const ctx = await _this.app.createAnonymousContext()
                ctx.header.appid = bodyJson.schema
                // 创建了未执行的任务 当即需要产生任务
                if (bodyJson.status === 0) {
                  await ctx.service.task.newsagencyService(bodyJson, bodyJson.schema)
                } else if (bodyJson.status === 3 || bodyJson.status === 5) {
                  await ctx.service.pdms.agencyDelete(bodyJson)
                }
              } catch (err) {
                _this.app.logger.error(err, err.code)
                if (err.transaction) {
                  if (!err.transaction.finished) {
                    err.transaction.rollback()
                  }
                }
              }
            })
            if (process.env.NODE_ENV === 'development') {
              // return
            }
            // 获取巡检对象类型mq
            const ctx = await _this.app.createAnonymousContext()
            ctx.header.appid = 'public'
            const pdmsMq = (await ctx.service.patrolObj.pdmsMq()) || {}
            const region = pdmsMq.rmcode
            if (!region.some(res => res === 'tb_region')) {
              region.push('tb_region')
            }
            // 单独处理动环事件更新与删除同步问题-环境量
            if (!region.some(res => res === 'tb_sensor_info')) {
              region.push('tb_sensor_info')
            }
            // 单独处理动环事件更新与删除同步问题-传感器
            if (!region.some(res => res === 'tb_transducer')) {
              region.push('tb_transducer')
            }
            // 单独处理动环事件更新与删除同步问题-设备
            if (!region.some(res => res === 'tb_pe_device')) {
              region.push('tb_pe_device')
            }
            // 单独处理红外、可见光
            if (!region.some(res => res === 'tb_camera')) {
              region.push('tb_camera')
            }
            for (const model of region) {
              const pdmsTopic = '/topic/pdms.pdmsmq.topic.model.data.' + model
              client.subscribe(pdmsTopic, async (body, headers) => {
                try {
                  const bodyJson = JSON.parse(body)
                  // 记录日志-巡检对象MQ监听
                  _this.app.hikLogger.info('巡检对象MQ监听' + bodyJson)
                  const ctx = await _this.app.createAnonymousContext()
                  ctx.header.appid = 'public'
                  await ctx.service.patrolObj.pdmsMqUpdate(
                    bodyJson,
                    pdmsMq.result,
                    model,
                    pdmsMq.objTypeResuout
                  )
                  // 动环处理
                  if (
                    model === 'tb_sensor_info' ||
                    model === 'tb_transducer' ||
                    model === 'tb_pe_device'
                  ) {
                    await ctx.service.plugins.donghuan.donghuanMqService(
                      bodyJson,
                      pdmsMq.result,
                      model
                    )
                  }
                  // 红外、可见光
                  if (model === 'tb_camera') {
                    await ctx.service.plugins.thermalCapture.thermalPlannedMQ(
                      bodyJson,
                      pdmsMq.result,
                      model
                    )
                  }
                } catch (err) {
                  _this.app.logger.error(err, err.code)
                  if (err.transaction) {
                    if (!err.transaction.finished) {
                      err.transaction.rollback()
                    }
                  }
                }
              })
            }
          },
          function (error) {
            _this.app.hikLogger.error('连接MQ失败')
          }
        )

        const logger = this.app.logger
        // 连接mq等操作已经移植到了agent中，不再在master中执行
        // Config, plugin files have been loaded.
        // 云台调度 还是需要在app 中 不然的话 agent无法获取service 的对应方法
        // edit buy bian
        const ptzdsDestination = '/topic/ptzds.ptzdsqueue.topic.task.process.push'
        const ptzdsClient = new Stomp(ip, port, username, this._decrypt(password))
        ptzdsClient.connect(
          function (sessionId) {
            _this.app.logger.info(
              `目标:${_this.app.thermalCapture_refPicTask} _this.app.thermalCapture_refPicTask`
            )
            _this.app.logger.info(
              `目标:${_this.app.plannedCapture_refPicTask} _this.app.plannedCapture_refPicTask`
            )
            _this.app.logger.info(`目标:${ptzdsDestination}连接成功 用于保存一键抓去参考图`)
            logger.debug(`目标:${ptzdsDestination}连接成功`)

            ptzdsClient.subscribe(ptzdsDestination, async function (body, headers) {
              // console.log('一键抓拍的图片集合', body)
              if (
                _this.app.plannedCapture_refPicTask &&
                _this.app.plannedCapture_refPicTask.length > 0
              ) {
                for (const [ i, taskItem ] of new Map(
                  _this.app.plannedCapture_refPicTask.map((taskItem, i) => [ i, taskItem ])
                )) {
                  let i = 0
                  const body_json = JSON.parse(body)
                  if (taskItem.taskId === body_json.taskId) {
                    this.app.logger.info('-------------------------', body_json.taskResult)
                    if (
                      body_json.taskResult &&
                      body_json.taskResult[0] &&
                      body_json.taskResult.find(ele => ele.commandCode === 'CapturePicture') &&
                      body_json.taskResult.find(ele => ele.commandCode === 'CapturePicture').result
                    ) {
                      this.app.logger.info('找到pic+++++++++++++++++++++++++', i++)
                      // console.log('body_json', body_json)
                      const pic = body_json.taskResult.find(
                        ele => ele.commandCode === 'CapturePicture'
                      ).result.picUrl
                      // console.log('找到pic+++++++++++++++++++++++++', i++)
                      const ctx = await _this.app.createAnonymousContext()

                      ctx.header.appid = taskItem.appid || taskItem.appId

                      const obj = {}
                      obj.pic = pic
                      obj.itemId = taskItem.itemId
                      obj.patrolObjId = taskItem.patrolObjId
                      obj.cameraId = taskItem.cameraId
                      obj.name = taskItem.name

                      if (_this.app.temp_plannedCapture_refPicTask) {
                        _this.app.temp_plannedCapture_refPicTask.push(obj)
                      } else {
                        _this.app.temp_plannedCapture_refPicTask = [ obj ]
                      }
                      // _this.app.refStatus = 1
                      !_this.app.refStatus &&
                        setTimeout(() => {
                          this.app.logger.info('边边', _this.app.temp_plannedCapture_refPicTask)
                          for (const i of _this.app.temp_plannedCapture_refPicTask) {
                            // nodejs.unhandledRejectionError: 请求header中缺失appId
                            if (i.pic) {
                              ctx.service.plugins.plannedCapture.saveRefPicAynsc(
                                i.pic,
                                i.itemId,
                                i.patrolObjId,
                                i.cameraId,
                                i.name
                              )
                            }
                          }
                        }, _this.app.plannedCapture_refPicTask.length * 2000)
                      _this.app.refStatus = 1
                      // if (
                      //   _this.app.temp_plannedCapture_refPicTask.length ===
                      //   _this.app.plannedCapture_refPicTask.length
                      // ) {
                      //   // 这边需要维护一个临时的数组 因为每个mq 都是独立的 用let不足以存储

                      // }
                    }
                  }
                }
              } else if (_this.app.thermalCapture_refPicTask) {
                for (const [ i, taskItem ] of new Map(
                  _this.app.thermalCapture_refPicTask.map((taskItem, i) => [ i, taskItem ])
                )) {
                  const body_json = JSON.parse(body)
                  if (taskItem.taskId === body_json.taskId) {
                    if (
                      body_json.taskResult &&
                      body_json.taskResult[0] &&
                      body_json.taskResult.find(ele => ele.commandCode === 'CapturePicture').result
                    ) {
                      const pic = body_json.taskResult.find(
                        ele => ele.commandCode === 'CapturePicture'
                      ).result.picUrl
                      const ctx = await _this.app.createAnonymousContext()
                      ctx.header.appid = taskItem.appid
                      const obj = {}
                      obj.pic = pic
                      obj.itemId = taskItem.itemId
                      obj.patrolObjId = taskItem.patrolObjId
                      obj.cameraId = taskItem.cameraId
                      obj.name = taskItem.name
                      if (_this.app.temp_thermalCapture_refPicTask) {
                        _this.app.temp_thermalCapture_refPicTask.push(obj)
                      } else {
                        _this.app.temp_thermalCapture_refPicTask = [ obj ]
                      }
                      if (
                        _this.app.temp_thermalCapture_refPicTask.length ===
                        _this.app.thermalCapture_refPicTask.length
                      ) {
                        // 这边需要维护一个临时的数组 因为每个mq 都是独立的 用let不足以
                        for (const i of _this.app.temp_thermalCapture_refPicTask) {
                          await ctx.service.plugins.thermalCapture.saveRefPicAynsc(
                            i.pic,
                            i.itemId,
                            i.patrolObjId,
                            i.cameraId,
                            i.name
                          )
                        }

                        _this.app.temp_thermalCapture_refPicTask = []
                        _this.app.thermalCapture_refPicTask = []
                      }
                    }
                  }
                }
              }
            })
          },
          function (error) {}
        )
      })
    } catch (e) {
      this.app.hikLogger.info('连接mq失败' + e)
    }
  }
  configWillLoad () {
    try {
      this.app.logger.info('***进入插件app配置的configWillLoad生命周期')
      this._configInit()
      this.app.logger.info('***结束插件app配置的configWillLoad生命周期')
    } catch (e) {
      this.app.logger.error(e)
    }
  }

  _configInit () {
    this.app.logger.info('***进入插件app配置的_configInit方法，根据环境加载不同配置文件')
    try {
      const { config, logger } = this.app
      let configFilePath
      let installationFilePath
      if (this.app.config.env === 'prod') {
        installationFilePath = '../../conf/installation.properties'
        configFilePath = '../../conf/config.properties'
        config.proxy = true
        this.configLogObj.proxy = true
        logger.info('env=prod , start read config.properties')
      } else {
        // return;
        installationFilePath = './config/installation.properties'
        configFilePath = './config/config.properties'
        logger.info('env=local , start read config propertis')
        // return;
      }

      if (fs.existsSync(configFilePath)) {
        const data = fs.readFileSync(configFilePath, {
          encoding: 'utf-8',
          flag: 'r'
        })
        if (data.indexOf('\r\n') > -1) {
          this._configProp = data.split('\r\n')
        } else {
          this._configProp = data.split('\n')
        }
        // edit by lrx

        this.app._configProp = this._configProp

        const datai = fs.readFileSync(installationFilePath, {
          encoding: 'utf-8',
          flag: 'r'
        })
        // edit by lrx
        if (datai.indexOf('\r\n') > -1) {
          this.app._installationProp = datai.split('\r\n')
        } else {
          this.app._installationProp = datai.split('\n')
        }
        // edit by bla
        // 涉及分机部署 因此需要使用 instance 的对象
        const context = this._getConfigProperoty('patrolengine-app.@instanceList')
        const db = this._getConfigProperoty('patrolenginedb.@instanceList')
        const redis = this._getConfigProperoty('patrolengine-cache.@instanceList')
        const webPort = this._getConfigProperoty('patrolengine-app.1.webPort')
        const ip = this._getConfigProperoty('patrolengine-app.1.@ip')

        config.static.prefix = this._getConfigProperoty(`${context}.@context`) // '/patrolengine-app'

        // 动态更改配置值
        config.consul.bicContext = this._getConfigProperoty('@bic.bic.context')
        config.consul.getComponentIpService =
          this._getConfigProperoty('@bic.bic.context') +
          '/svrService/v2/service/{componentId}/{serviceType}'
        config.consul.cibServerIp = this._getConfigProperoty('@bic.bic.ip') // 'https://10.13.69.225'
        config.consul.cibServerPort = this._getConfigProperoty('@bic.bic.port')
        config.consul.protocol = this._getConfigProperoty('@bic.bic.protocol')

        config.sequelize.database = this._getConfigProperoty(`${db}.@parent.@dbname`)
        config.sequelize.host = this._getConfigProperoty(`${db}.@parent.@ip`) // '10.13.69.225'
        config.sequelize.port = this._getConfigProperoty(`${db}.@parent.port`) // '7092'
        config.sequelize.username = this._getConfigProperoty(`${db}.@parent.@dbusername`) // 'postgres'
        config.sequelize.password = this._decrypt(
          this._getConfigProperoty(`${db}.@parent.@dbpassword`)
        ) // 'LhXQaSzD'

        config.redis.client.host = this._getConfigProperoty(`${redis}.@parent.@ip`) // '10.15.66.109'
        config.redis.client.port = this._getConfigProperoty(`${redis}.@parent.port`) // '6379'
        config.redis.client.password = this._decrypt(
          this._getConfigProperoty(`${redis}.@parent.@password`)
        ) // '123456'

        config.hikcas.appUrl = 'https://' + this._getConfigProperoty('@bic.cas.ip')
        config.hikcas.casServiceValidateUrl =
          this._getConfigProperoty('@bic.cas.protocol') +
          '://' +
          this._getConfigProperoty('@bic.cas.ip') +
          ':' +
          this._getConfigProperoty('@bic.cas.port') +
          '/bic/ssoService/v1'
        config.hikcas.casLogin =
          'http://' + this._getConfigProperoty('@bic.cas.ip') + '/bic/ssoService/v1/casLogin'
        config.cluster.listen.hostname = ip
        config.cluster.listen.port = typeof webPort === 'string' ? parseInt(webPort, 10) : webPort
        config.hikcas.casUrl =
          this._getConfigProperoty('@bic.cas.protocol') +
          '://' +
          this._getConfigProperoty('@bic.cas.ip') +
          '/portal/cas/' // 'http://10.19.157.80:8001'
        // config.hikcas.casServiceValidateUrl = this._getConfigProperoty('@bic.cas.protocol') + '://' + this._getConfigProperoty('@bic.cas.ip') + ':' + this._getConfigProperoty('@bic.cas.port') + '/center_cas/ssoService/v1' // 'http://10.19.157.80:8001/center_cas/ssoService/v1'
        logger.info(
          'config init success, change config content:' + JSON.stringify(this.configLogObj)
        )
        const _this = this
        const Stomp = require('stomp-client')
        const queue = this._getConfigProperoty('patrolengine-queue.@instanceList')
        const _ip = this._getConfigProperoty(`${queue}.@parent.@ip`)
        const _port = this._getConfigProperoty(`${queue}.@parent.port`)
        const _username = this._getConfigProperoty(`${queue}.@parent.@username`)
        const _password = this._getConfigProperoty(`${queue}.@parent.@password`)
        // 记录日志-启动
        const client2 = new Stomp(_ip, _port, _username, decryption(_password))
        client2.connect(
          function (sessionId) {
            _this.app.hikLogger.warn('准备client2连接成功')
            _this.app.tlncClient = client2
          },
          function (error) {
            _this.app.hikLogger.warn('准备client2连接失败')
          }
        )
      } else {
        this.app.logger.warn('config.properties not exist,user local config!')
      }
    } catch (e) {
      this.app.hikLogger.info('连接远程失败')
    } finally {
      this.app.logger.info('***结束插件app配置的_configInit方法')
    }
  }

  _getConfigProperoty (key) {
    if (this._configProp) {
      // 用‘=’分割配置项，匹配‘=’前的配置项内容跟传入的key是否相等，相等即代表配置中存在该配置项
      const valueList = this._configProp.filter(d => d.split('=')[0] === key)
      if (valueList && valueList.length > 0) {
        return valueList[0].substring(valueList[0].indexOf('=') + 1)
      }
      this.app.logger.warn(key + " does't has the value")
      return key
    }
    this.app.logger.warn('configProp [' + key + '] is undefined,please check config.properties')
    return key
  }

  _decrypt (val) {
    return decryption(val)
  }
  configDidLoad () {}
  async didLoad () {
    this.app.logger.info('***进入插件app配置的didLoad生命周期，此周期内无任何操作')
    // All files have loaded, start plugin here.
  }

  async willReady () {
    this.app.logger.info('***进入插件app配置的willReady生命周期，此周期内无任何操作')
    // All plugins have started, can do some thing before app ready
  }

  async serverDidReady () {
    this.app.logger.info('***进入插件app配置的serverDidReady生命周期，此周期内无任何操作')
    // Server is listening.
  }

  async beforeClose () {
    this.app.logger.info('***进入插件app配置的beforeClose生命周期，此周期内无任何操作')
    // Do some thing before app close.
  }
}

module.exports = AppBootHook

