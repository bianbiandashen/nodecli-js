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

## Install

```bash
$ npm i egg-hik-operatelog --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.hikOperatelog = {
  enable: true,
  package: 'egg-hik-operatelog',
};

// {app_root}/app/router.js
//router url must end with .do
//add ignore middleware for some requests 
const logIgnore = app.middleware.logIgnore(); 
subRouter.get('/logIgnore.do',logIgnore,controller.home.logIgnore);

// {app_root}/app/controller/xxx.js
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

## Configuration

```js
// {app_root}/config/config.default.js
exports.customLogger = {
        hikOperateLogger: {
            file: `../../logs/${config.serverName}/${config.componentID}.${config.serverName}.business.log`,
            formatter: meta=>{
                return `${moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')} - ${meta.message}`;
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
