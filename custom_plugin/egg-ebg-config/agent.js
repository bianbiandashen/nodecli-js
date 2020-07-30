/* eslint-disable prefer-const */
const fs = require('fs')
const { decryption } = require('hikidentify')
const stat = fs.stat
const { resolve } = require('path')
const copy = function (src, dst) {
  // 读取目录中的所有文件/目录
  const _this = this
  fs.readdir(src, function (err, paths) {
    if (err) {
      throw err
    }

    paths.forEach(function (path) {
      const _src = src + '/' + path
      const _dst = dst + '/' + path
      let readable
      let writable

      stat(_src, function (err, st) {
        if (err) {
          throw err
        }

        // 判断是否为文件
        if (st.isFile()) {
          // 创建读取流
          readable = fs.createReadStream(_src)
          // 创建写入流
          writable = fs.createWriteStream(_dst)
          // 通过管道来传输流
          readable.pipe(writable)
          console.log(_src + 'to' + _dst)
        } else if (st.isDirectory()) {
          exists(_src, _dst, copy)
        }
      })
    })
  })
}
// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
const exists = function (src, dst, callback) {
  fs.exists(dst, function (exists) {
    // 已存在
    if (exists) {
      callback(src, dst)
    } else {
      fs.mkdir(dst, function () {
        callback(src, dst)
      })
    }
  })
}
class AppBootHook {
  constructor (app) {
    this.app = app
    this.configLogObj = {}
    this._configProp
    this._serviceDirAddr
    // 也可以通过 messenger 对象发送消息给 App Worker(mq)
    this.agentFun()
    // 也可以通过 messenger 对象发送消息给 App Worker(巡检对象启动同步)
    this.agentPatrolObjAsyncFun()
  }
  // 同步对象
  agentPatrolObjAsyncFun () {
    try {
      const agent = this.app
      agent.messenger.on('egg-ready', () => {
        const data = {}
        agent.messenger.sendRandom('patrol_async_action', data)
      })
    } catch (error) {
      this.app.logger.error(error)
    }
  }
  agentFun () {
    try {
      const agent = this.app
      agent.messenger.on('egg-ready', () => {
        try {
          // 寻址
          const queue = this._getConfigProperoty('patrolengine-queue.@instanceList')
          const ip = this._getConfigProperoty(`${queue}.@parent.@ip`)
          const port = this._getConfigProperoty(`${queue}.@parent.port`)
          const username = this._getConfigProperoty(`${queue}.@parent.@username`)
          const password = this._getConfigProperoty(`${queue}.@parent.@password`)
          const data = { ip, port, username, password }
          agent.messenger.sendRandom('mq_action', data)
        } catch (error) {
          this.app.logger.error(error)
        }
      })
    } catch (error) {
      this.app.logger.error(error)
    }
  }
  configWillLoad () {

    try {
      this.app.logger.info('worker config init begin...')
      this._configInit()
      this.app.logger.info('worker config init end...')
    } catch (e) {
      this.app.logger.error(e)
    }
  }

  _configInit () {
    console.log('***进入插件agent配置的_configInit方法，根据环境加载不同配置文件')
    const { config, logger } = this.app
    let configFilePath
    let installationFilePath
    // console.log('\n\n\nconfig: ', config)
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
      logger.info('config init success, change config content:' + JSON.stringify(this.configLogObj))
    } else {
      this.app.logger.warn('config.properties not exist,user local config!')
    }
    console.log('***插件agent配置的_configInit方法执行完毕')
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

  configDidLoad () {
    try {

      this.app.tempPlguinArray = []
      console.log('***进入插件agent配置的configDidLoad生命周期')
      const shelljs = require('shelljs')
      const _this = this

      const Stomp = require('stomp-client')
      const queue = this._getConfigProperoty('patrolengine-queue.@instanceList')
      console.log('***queuequeuequeuequeue', queue)
      console.log('this.app==================', this.app)
      console.log('this.app==================', this.app.tempPlguinArray)
      const ip = this._getConfigProperoty(`${queue}.@parent.@ip`)
      const port = this._getConfigProperoty(`${queue}.@parent.port`)
      const username = this._getConfigProperoty(`${queue}.@parent.@username`)
      const password = this._getConfigProperoty(`${queue}.@parent.@password`)
      const logger = this.app.logger

      // console.log(ip, port, username, this._decrypt(password))
      console.log('ip:', ip)
      console.log('port:', port)
      console.log('username:', username)
      console.log('password:', this._decrypt(password))
      const destination = '/queue/patrol-engine.queue.frontend.resource'
      const client = new Stomp(ip, port, username, this._decrypt(password))
      const that = this
      client.connect(
        function (sessionId) {
          console.log('connected + 数据隔离MQ连接成功', sessionId)
          logger.debug(`connected + 数据隔离MQ连接成功，地址为:${ip}:${port}`)
          logger.debug(`目标:${destination}`)
          //   {
          //     "frontPath": "D://frontPath",
          //     "schema": "edu"
          // }
          // const oldCopyAdd = `${resolve('./')}\\custom_plugin\\egg-ebg-config\\copymodel.sh`
          // console.log('oldCopyAdd', oldCopyAdd)
          // const newCopyAdd = oldCopyAdd.replace(/\\/g, '/')
          // console.log('newCopyAdd', newCopyAdd)
          // const oldModelAdd = `${resolve('./')}\\app\\model`
          // const newModelAdd = oldModelAdd.replace(/\\/g, '/')
          // shelljs.exec(
          //   `${newCopyAdd} ${newModelAdd} pes`,
          //   {
          //     async: true
          //   },
          //   function(e) {
          //     const reboot = `${resolve('./')}\\custom_plugin\\egg-ebg-config\\reboot.sh`
          //     shelljs.exec(
          //       reboot,
          //       {
          //         async: true
          //       },
          //       function(e) {}
          //     )
          //   }
          // )

          client.subscribe(destination, function (body, headers) {
            console.log('+++++++++++++++++ mq copy', body)
            const schema = body && JSON.parse(body) && JSON.parse(body).schema
            const frontPath = body && JSON.parse(body) && JSON.parse(body).frontPath
            if (schema) {
              const pathFull = resolve('./') + `/app/model/patrolObj_${schema}.js`
              const pathFullCh = pathFull.replace(/\\/g, '/')
              console.log('schemaschema', pathFullCh)
              // =========================== 增加前端的校验 如果 shcema 中存在则不在做拷贝
              fs.exists(pathFullCh, function (exists) {

                console.log(exists ? '存在schema' : '开始创建')
                console.log('执行拷贝的命令++++++++++++++++++++++++++' + exists)
                if (exists) {
                  console.log('执行拷贝的命令++++++++++++++++++++++++++22' + exists)
                  return false
                }
                console.log('执行拷贝的命令++++++++++++++++++++++++++' + body)
                const oldCopyAdd = `${resolve('./')}\\custom_plugin\\egg-ebg-config\\copymodel.sh`
                const newCopyAdd = oldCopyAdd.replace(/\\/g, '/')
                const oldModelAdd = `${resolve('./')}\\app\\model`
                const newModelAdd = oldModelAdd.replace(/\\/g, '/')
                console.log('拷贝前的时间' + new Date())
                shelljs.exec(`${newCopyAdd} ${newModelAdd} ${schema}`, { async: true }, function (e) {

                  // setTimeout(function() {
                  //   logger.debug('newDate33333' + new Date())
                  //   logger.debug('this.app.isCopy++++++++++++++1+++ ' + _this.app.isCopy)
                  //   if (!_this.app.isCopy) {
                  //     logger.debug('拷贝脚本执行失败 ' + e)
                  //     const reboot = `${resolve('./')}\\custom_plugin\\egg-ebg-config\\reboot.sh`

                  //     shelljs.exec(
                  //       reboot,
                  //       {
                  //         async: true
                  //       },
                  //       function(e) {
                  //         _this.app.isCopy = 1
                  //         logger.debug('this.app.isCopy ++++++++++++++2++++++' + _this.app.isCopy)
                  //       }
                  //     )
                  //   }
                  // }, 10000)
                  // logger.debug('newDate444444' + new Date())
                  // logger.debug('this.app.isCopy ++++++++++++3++++++++' + _this.app.isCopy)
                })
                // 每次拷贝资源包 预计2-3秒 可以完成 因此5秒侯
                setTimeout(function () {
                  console.log('准备重启', that.app.tempPlguinArray)
                  if (that.app.tempPlguinArray && that.app.tempPlguinArray.length > 0 && that.app.tempPlguinArray.find(ele => !ele.status)) {
                    console.log('同时有他人导入 停止重启', that.app.tempPlguinArray)
                    return
                  }
                  const rebootAddress = `${resolve('./')}/custom_plugin/egg-ebg-config/reboot.sh`
                  console.log('重启了++++++++++++++++ ' + frontPath)
                  shelljs.exec(rebootAddress, { async: true }, function (e) {
                    console.log('重启了++++++++++++++++', e)
                  })


                  // this.app.tempPlguinArray.filter(ele => ele.status)
                }, 10000)
              })


            } else if (frontPath) {
              if (process.env.NODE_ENV === 'development') {
                // return
              } else {
                // if (this.tempPlguinArray && this.tempPlguinArray.length > 0 && this.tempPlguinArray.find(ele => ele.frontPath === frontPath)) {
                //   return
                // }
                // _this.app.isCopy = 0
                console.log('that.appthat.appthat.appthat.app' + that.app)
                console.log('  that.app.tempPlguinArray  that.app.tempPlguinArray' + that.app.tempPlguinArray)
                that.app.tempPlguinArray.push({ frontPath, status: 0 })
                console.log('开始拷贝插件包', that.app.tempPlguinArray)
                exists(frontPath + '/nodePlugin', resolve('./') + '/app', copy)
                that.app.tempPlguinArray.forEach(ele1 => {
                  if (ele1.frontPath === frontPath) {
                    ele1.status = 1
                  }
                })
                console.log('结束拷贝插件包', that.app.tempPlguinArray)
                console.log('拷贝脚frontpath本执行情况 ' + frontPath)
                // 每次拷贝资源包 预计2-3秒 可以完成 因此5秒侯
                setTimeout(function () {
                  console.log('准备重启', that.app.tempPlguinArray)
                  if (that.app.tempPlguinArray && that.app.tempPlguinArray.length > 0 && that.app.tempPlguinArray.find(ele => !ele.status)) {
                    console.log('同时有他人导入 停止重启', that.app.tempPlguinArray)
                    return
                  }
                  const rebootAddress = `${resolve('./')}/custom_plugin/egg-ebg-config/reboot.sh`
                  console.log('重启了++++++++++++++++ ' + frontPath)
                  shelljs.exec(rebootAddress, { async: true }, function (e) {
                    console.log('重启了++++++++++++++++', e)
                  })


                  // this.app.tempPlguinArray.filter(ele => ele.status)
                }, 10000)
              }
            }


          })
          // client.publish(destination, 'Hello World!');
          function publish () {
            setTimeout(function () {
              client.publish(destination, 'Hello World!')
            }, 5000)
          }
          // publish();
        },
        function (error) {
          console.log('-----------!')
          console.log(`node初始化过程中,destination为：${destination}的mq连接失败，请检查配置。`)
          console.error(`node初始化过程中,destination为：${destination}的mq连接失败，请检查配置。`)
          // console.error(error)
        }
      )
    } catch (e) {
      this.app.logger.error(e)
    }
    // Config, plugin files have been loaded.
  }

  async didLoad () {
    console.log('***进入插件agent配置的didLoad生命周期，此周期内无任何操作')
    // All files have loaded, start plugin here.
  }

  async willReady () {
    console.log('***进入插件agent配置的willReady生命周期，此周期内无任何操作')
    // All plugins have started, can do some thing before app ready
  }

  async serverDidReady () {
    console.log('***进入插件agent配置的serverDidReady生命周期，此周期内无任何操作')
    // Server is listening.
  }

  async beforeClose () {
    console.log('***进入插件agent配置的beforeClose生命周期，此周期内无任何操作')
    // Do some thing before app close.
  }
}

module.exports = AppBootHook

// module.exports = app => {
//   console.log('ssss')
//   app.beforeStart(async () => {
//     console.log('dddd')
//   })
// }
