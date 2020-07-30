# egg-hik-operatelog

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-hik-operatelog.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-hik-operatelog
[travis-image]: https://img.shields.io/travis/eggjs/egg-hik-operatelog.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-hik-operatelog
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-hik-operatelog.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-hik-operatelog?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-hik-operatelog.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-hik-operatelog
[snyk-image]: https://snyk.io/test/npm/egg-hik-operatelog/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-hik-operatelog
[download-image]: https://img.shields.io/npm/dm/egg-hik-operatelog.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-hik-operatelog

<!--
Description here.
-->

## 依赖说明

### 依赖的 egg 版本

egg-hik-operatelog 版本 | egg 1.x
--- | ---
2.x | 😁
1.x | ❌

### 依赖的插件
<!--

如果有依赖其它插件，请在这里特别说明。如

- security
- multipart

-->

## 开启插件

```js
// config/plugin.js
exports.hikOperatelog = {
  enable: true,
  package: 'egg-hik-operatelog',
};
```

## 使用场景
```js
// {app_root}/app/router.js
//拦截.do结尾的url请求默认写操作日志
//可以在路由层配置忽略某次请求的操作日志写入 
const logIgnore = app.middleware.logIgnore(); 
subRouter.get('/logIgnore.do',logIgnore,controller.home.logIgnore);


// {app_root}/app/controller/xxx.js
//操作日志业务字段
const operateLog = this.app.hikOperatelog.get(ctx);
if (operateLog) {
            operateLog.setModuleId(moduleId)
                .setObjectType(objectType)
                .setObjectName(objectName)
                .setAction(action)
                .setActionDetail(JSON.stringify(actionDetail) || '')
                .setActionMessageId(actionMessageId)
                .setActionMultiLang('1')
                .setTerminalType('0')
                .setResult(result || '')
                .setUserId(this.user.userIndexCode)
                .setUserName(this.user.username);
        }
```


## 详细配置

```js
// {app_root}/config/config.default.js
//操作日志文件名格式及指定的核心服务存放路径
exports.customLogger = {
        hikOperateLogger: {
            file: `../../logs/${config.serverName}/${config.componentID}.${config.serverName}.business.log`,
            formatter: meta=>{
                return `${moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')} - ${meta.message}`;
            }
        }
    };
```

请到 [config/config.default.js](config/config.default.js) 查看详细配置项说明。

## 单元测试

<!-- 描述如何在单元测试中使用此插件，例如 schedule 如何触发。无则省略。-->

## 提问交流

请到 [egg issues](https://github.com/eggjs/egg/issues) 异步交流。

## License

[MIT](LICENSE)
