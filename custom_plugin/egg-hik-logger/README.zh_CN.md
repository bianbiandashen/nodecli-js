# egg-hik-logger

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-hik-logger.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-hik-logger
[travis-image]: https://img.shields.io/travis/eggjs/egg-hik-logger.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-hik-logger
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-hik-logger.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-hik-logger?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-hik-logger.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-hik-logger
[snyk-image]: https://snyk.io/test/npm/egg-hik-logger/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-hik-logger
[download-image]: https://img.shields.io/npm/dm/egg-hik-logger.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-hik-logger

<!--
Description here.
-->

## 依赖说明

### 依赖的 egg 版本

egg-hik-logger 版本 | egg 1.x
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
exports.hikLogger = {
  enable: true,
  package: 'egg-hik-logger',
};


```

## 使用场景
```js

//{app_root}/app/controller/xxx.js  
this.app.hikLogger.error('0x09a01006',new Error('Hello World')); //with errorCode
this.app.hikLogger.info('Hello World');

```
- 带有错误码日志符合运管的采集格式
- 错误日志格式: 2018-12-17T16:24:46.148+08:00 ERROR chicken-hik-web [12064] [/] [0x09a01006] -  Error: Hello World
      at HomeController.index (E:\workspace_egg\chicken-hik-web\app\controller\home.js:17:46)
      at <anonymous>
      at process._tickCallback (internal/process/next_tick.js:189:7)

## 详细配置
```js
// {app_root}/config/config.default.js
exports.hikLogger = {
};

//复用 egg-logger请求级别日志的配置
config.logger  = {
    dir:`../../logs/${config.serverName}`,
    appLogName: `${config.componentID}.${config.serverName}.debug.log`
};

```

请到 [config/config.default.js](config/config.default.js) 查看详细配置项说明。

## 单元测试

<!-- 描述如何在单元测试中使用此插件，例如 schedule 如何触发。无则省略。-->

## 提问交流

请到 [egg issues](https://github.com/eggjs/egg/issues) 异步交流。

## License

[MIT](LICENSE)
