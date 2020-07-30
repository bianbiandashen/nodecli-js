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

## Install

```bash
$ npm i egg-hik-tracer --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.hikTracer = {
  enable: true,
  package: 'egg-hik-tracer',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.customLogger = {
    hikDtsLogger:{
        file: `../../logs/${config.serverName}/${config.componentID}.${config.serverName}.dts.log`,
            formatter: meta=>{
                        return `${moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')} [${meta.pid}] ${meta.message}`;
            }
        }
    };

exports.skipTraceUrl ={
    ignore: []
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

<!-- example here -->

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
