# egg-hik-tracer

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-hik-tracer.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-hik-tracer
[travis-image]: https://img.shields.io/travis/eggjs/egg-hik-tracer.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-hik-tracer
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-hik-tracer.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-hik-tracer?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-hik-tracer.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-hik-tracer
[snyk-image]: https://snyk.io/test/npm/egg-hik-tracer/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-hik-tracer
[download-image]: https://img.shields.io/npm/dm/egg-hik-tracer.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-hik-tracer

<!--
Description here.
-->

## 依赖说明

### 依赖的 egg 版本

egg-hik-tracer 版本 | egg 2.x
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
exports.hikTracer = {
  enable: true,
  package: 'egg-hik-tracer',
};
```

## 使用场景

- Why and What: 用于开启组件之间接口调用跟踪，将调用结果写入到日志文件中。

- How: 每发起一个对外接口调用，都会将相应的调用结果成功、失败（错误码、错误信息）结果写入到 组件名.服务名.dts.log文件中。
具体路径为{app_root}/../../logs/服务名/组件名.服务名.business.log

## 详细配置
```js
// {app_root}/config/config.default.js
//调用链日志文件名格式及指定的存放路径
exports.customLogger = {
    hikDtsLogger:{
        file: `../../logs/${config.serverName}/${config.componentID}.${config.serverName}.dts.log`,
            formatter: meta=>{
                        return `${moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')} [${meta.pid}] ${meta.message}`;
            }
        }
    };

//可配置忽略的http请求路径，支持字符串、函数、正则表达式
exports.skipTraceUrl ={
    ignore: []
};
```
请到 [config/config.default.js](config/config.default.js) 查看详细配置项说明。

## 单元测试

<!-- 描述如何在单元测试中使用此插件，例如 schedule 如何触发。无则省略。-->

## 提问交流

请到 [egg issues](https://github.com/eggjs/egg/issues) 异步交流。

## License

[MIT](LICENSE)
