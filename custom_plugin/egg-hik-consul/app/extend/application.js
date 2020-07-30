/* eslint-disable indent */
'use strict';
const DisCoveryFun = require('../consul/discoveryFun');
const tokenStore = require('../consul/tokenLocalStorage');
const constants = require('constants');
const Exception = require('./Exception');
const FormStream = require('formstream');
const ErrorCodes = {
  ERROR_0x09b00000: [ '0x09b00000', 'xmap.web.errorcode.common.unknowError' ],
};
function bufferToJson(data) {
  return Buffer.isBuffer(data) ? JSON.parse(data.toString()) : {};
}
module.exports = {
  // 获取服务
  async consulCurl(path, componentId = '', serviceType = '', options = {}, contentType) {
    if (!path) {
      return null;
    }
    try {
      // 增加token头认证
      if ((options.headers && !options.headers['content-type']) || !options.headers) {
        if (!options.headers) {
          options.headers = {};
        }
        if (contentType) {
          options.headers['content-type'] = contentType;
        } else {
          options.headers['content-type'] = 'application/json';
        }
      }
      // const appId = this.ctx.header.appid;

      options.headers = Object.assign(options.headers || {}, tokenStore.getItem('Token'));

      options.rejectUnauthorized = false;
      options.secureOptions = constants.SSL_OP_NO_TLSv1;
      if (path.startsWith('http') || path.startsWith('https')) {
        return await this.curl(path, options);
      }

      // 获取负载均衡服务地址
      const discovery = new DisCoveryFun(this);
      let serviceAddr = null;

      serviceAddr = await discovery.loadEgbServiceAddress(
        componentId || this.config.consul.EBG_SERVICE,
        serviceType,
        options,
        path
      );
      // serviceAddr = await discovery.loadUpmSeviceAddress(
      //   componentId || this.config.consul.EBG_SERVICE,
      //   serviceType,
      //   options,
      //   path
      // );
      path = `${serviceAddr}${path}`;
      const changeOptions = Object.assign(options, {
        rejectUnauthorized: false,
        secureOptions: constants.SSL_OP_NO_TLSv1,
      });

      if (changeOptions.file) {
        const form = new FormStream();
        if (changeOptions.file.type === 'buffer') {
          form.buffer(
            changeOptions.file.name,
            changeOptions.file.fileBuffer,
            changeOptions.file.fileName,
            'multipart/form-data'
          );
        } else {
          form.stream(
            changeOptions.file.name,
            changeOptions.file.fileStream,
            changeOptions.file.fileName,
            'multipart/form-data'
          );
        }

        changeOptions.stream = form;
        changeOptions.headers['content-type'] = 'multipart/form-data;boundary=' + form._boundary;
      }
      if (changeOptions.headers.userId) {
        // 组件间调用 存在userid
        changeOptions.headers.userId = Buffer.from(changeOptions.headers.userId).toString('base64');
        changeOptions.headers.appId =
          this.createAnonymousContext() &&
          this.createAnonymousContext().header &&
          this.createAnonymousContext().header.appid;
      }
      this.hikLogger.debug('==================curl path=================');
      this.hikLogger.debug(path);
      console.log('pathpathpathpathpath', path);
      console.log('changeOptionschangeOptionschangeOptions', changeOptions);
      const res = await this.curl(path, changeOptions);
      // throw new Exception(e.message, (e.code = 500), transaction)
      return res;
    } catch (e) {
      this.hikLogger.error(e, ErrorCodes.ERROR_0x09b00000);
    }
  },
};

// module.exports = {
//   // 获取服务
//   async consulCurl(service, path, options = {}) {
//     if (!path) {
//       return null;
//     }

//     //增加token头认证
//     options.headers = Object.assign(
//       options.headers || {},
//       tokenStore.getItem("Token")
//     );

//     if (path.startsWith("http") || path.startsWith("https")) {
//       return await this.curl(path, options);
//     }

//     //获取负载均衡服务地址
//     // const discovery = new Discovery(this);
//     // const serviceAddr = await discovery.loadServiceAddress(service);
//     // path = `${serviceAddr}${path}`;

//      return await this.curl(path, options);
//   }
// };
