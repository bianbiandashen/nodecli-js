/*
 * @Author: bian
 * @Date: 2019-10-28 19:35:58
 * @Description:111
 * @LastEditors: bain
 * @LastEditTime: 2019-11-08 15:33:05
 */
'use strict'
const { EggShell } = require('egg-shell-decorators')

module.exports = app => {
  EggShell(app, {
    prefix: '/patrolengine-app',
    quickStart: false,
    swaggerOpt: {
      open: true,
      title: '示例',
      version: '1.0.0',
      host: '127.0.0.1',
      port: 7001,
      schemes: ['http'],
      paths: {
        //  outPath: '../api-docs/public/json/main.json',
        definitionPath: './definitions',
        swaggerPath: './swagger'
      },
      tokenOpt: {
        default: 'manager',
        tokens: {
          manager: '123',
          user: '321'
        }
      }
    }
  })
  // console.log(app.controller)
  // app.get('/common/common/index', app.controller.common.common.index)
  // 让/patrolapp指向静态资源目录下的index.html
  // app.get('patrolengine-app ', app.controller.common.getIndex)
  // // 让/patrolapp/*一类的url可以正常访问，而不是404
  // app.get('patrolengine-app/*', app.controller.common.getIndex)
}
