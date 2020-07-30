# egg-egg-hik-consul

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-egg-hik-consul.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-egg-hik-consul
[travis-image]: https://img.shields.io/travis/eggjs/egg-egg-hik-consul.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-egg-hik-consul
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-egg-hik-consul.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-egg-hik-consul?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-egg-hik-consul.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-egg-hik-consul
[snyk-image]: https://snyk.io/test/npm/egg-egg-hik-consul/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-egg-hik-consul
[download-image]: https://img.shields.io/npm/dm/egg-egg-hik-consul.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-egg-hik-consul

<!--
Description here.
-->

## 依赖说明

### 依赖的 egg 版本

egg-hik-consul 版本 | egg 2.x
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
exports.hikConsul = {
  enable: true,
  package: 'egg-hik-consul',
};
```

## 使用场景

- Why and What: 描述为什么会有这个插件，它主要在完成一件什么事情。
尽可能描述详细。
- How: 描述这个插件是怎样使用的，具体的示例代码，甚至提供一个完整的示例，并给出链接。

## 详细配置

```js
// {app_root}/config/config.default.js
exports.hikConsul = {
    client: {
            host: {
                ip: '127.0.0.1', // consul注册中心IP , 默认 127.0.0.1
                port: 8500, // consul注册中心端口, 默认 8500
                defaults: { // 可选参数
                    token: ''
                }
            },
            server: {
                name: 'egg-hik-consul', // 注册到consul服务名, 默认工程名
                address: '127.0.0.1', // 本地服务IP，默认本地IP
                port: 7001, // 本地服务端口，默认本地port
                check: {
                    path: '/health' // 健康检查http路径
                },
                tags: ['nodejs','web'] // 服务标签
            }
        }
};

//{app_root}/app/controller/xxx.js 
const result = await app.consulCurl('xmap-web', '/xmap-web/service/rs/v1/xmapConfigService/fetchXmapInitConfig',{
    dataType: 'json',
});
```

请到 [config/config.default.js](config/config.default.js) 查看详细配置项说明。

## 单元测试

<!-- 描述如何在单元测试中使用此插件，例如 schedule 如何触发。无则省略。-->

## 提问交流

请到 [egg issues](https://github.com/eggjs/egg/issues) 异步交流。

## License

[MIT](LICENSE)
