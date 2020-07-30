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

## Install

```bash
$ npm i egg-hik-logger --save
```

## Usage

```js

// {app_root}/config/plugin.js
exports.hikLogger = {
  enable: true,
  package: 'egg-hik-logger',
};

//{app_root}/app/controller/xxx.js  
this.app.hikLogger.error('0x09a01006',new Error('Hello World')); //with errorCode
this.app.hikLogger.info('Hello World');
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.hikLogger = {
};

//use egg-logger configuration
config.logger  = {
    dir:`../../logs/${config.serverName}`,
    appLogName: `${config.componentID}.${config.serverName}.debug.log`
};

```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

<!-- example here -->

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
