'use strict'

const path = require('path')

exports.sequelize = {
  enable: true,
  path: path.join(__dirname, '../custom_plugin/egg-sequelize')
  // package: 'egg-sequelize'
}
exports.hikStartup = {
  enable: true,
  // package: 'egg-hik-startup'
  path: path.join(__dirname, '../custom_plugin/egg-ebg-config')
}
// exports.tt = {
//   enable: true,
//   package: 'egg-hik-startup'
//   path: path.join(__dirname, '../custom_plugin/egg-ebg-config'),
// };
exports.redis = {
  enable: true,
  package: 'egg-redis'
}
exports.consul = {
  enable: true,
  path: path.join(__dirname, '../custom_plugin/egg-hik-consul')
}
exports.hikLogger = {
  enable: true,
  package: 'egg-hik-logger',
  path: path.join(__dirname, '../custom_plugin/egg-hik-logger')
}
exports.hikTracer = {
  enable: true,
  // package: 'egg-hik-tracer'
  path: path.join(__dirname, '../custom_plugin/egg-hik-tracer')
}
exports.hikcas = {
  enable: true,
  // package: 'egg-hik-cas'
  path: path.join(__dirname, '../custom_plugin/egg-hik-cas')
}
exports.hikOperatelog = {
  enable: true,
  // package: 'egg-hik-operatelog'
  path: path.join(__dirname, '../custom_plugin/egg-hik-operatelog')
}
// exports.sessionRedis = {
//     enable: true,
//     package: 'egg-session-redis'
// };

// exports.validate = {
//   enable: true,
//   package: 'egg-validate'
// };

exports.validatePlus = {
  enable: true,
  package: 'egg-validate-plus'
}

exports.static = {
  enable: true,
  package: 'egg-static'
}

exports.passport = {
  enable: true,
  package: 'egg-passport'
}

// exports.swaggerdoc = {
//   enable: true,
//   package: 'egg-swagger-doc'
// }

exports.nunjucks = {
  enable: true,
  package: 'egg-view-nunjucks'
}
// config/plugin.js
exports.alinode = {
  enable: true,
  package: 'egg-alinode'
}
