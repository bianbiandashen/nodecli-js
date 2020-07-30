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

## Install

```bash
$ npm i egg-hik-consul --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.hikConsul = {
  enable: true,
  package: 'egg-hik-consul',
};

//{app_root}/app/controller/xxx.js 
const result = await app.consulCurl('xmap-web', '/xmap-web/service/rs/v1/xmapConfigService/fetchXmapInitConfig',{
    dataType: 'json',
});
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.hikConsul = {
    client: {
            host: {
                ip: '127.0.0.1', // register center ip , default 127.0.0.1
                port: 8500, // register center port, default 8500
                defaults: { // optional
                    token: ''
                }
            },
            server: {
                name: 'egg-hik-consul', // project name, default project name
                address: '127.0.0.1', // service ip, default extranet ip
                port: 7001, // service port, default service port
                check: {
                    path: '/health' // health check http path
                },
                tags: ['nodejs','web'] // service tags
            }
        }
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

<!-- example here -->

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
