/* eslint-disable indent */
'use strict';
const DisCoveryFun = require('../consul/discoveryFun');
const tokenStore = require('../consul/tokenLocalStorage');
const constants = require('constants');
const Exception = require('./Exception');
const FormStream = require('formstream');
const ErrorCodes = { ERROR_0x09b00000: [ '0x09b00000', 'xmap.web.errorcode.common.unknowError' ] };
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

      options.headers = Object.assign(options.headers || {}, tokenStore.getItem('Token'));

      // console.log('------------token---------------------', tokenStore.getItem('Token'));
      options.rejectUnauthorized = false;
      options.secureOptions = constants.SSL_OP_NO_TLSv1;
      if (path.startsWith('http') || path.startsWith('https')) {
        return await this.curl(path, options);
      }

      // 获取负载均衡服务地址
      const discovery = new DisCoveryFun(this);
      let serviceAddr = null;
      serviceAddr = await discovery.loadEgbServiceAddress(
        componentId || this.app.config.consul.EBG_SERVICE,
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
      // if (changeOptions.headers.userId) {
      //   changeOptions.headers.userId = Buffer.from(changeOptions.headers.userId).toString('base64');
      // }
      const appId = this.header.appid;
      // 组件间调用 存在userid
      // 没有显示传递的话 用 header 上的 appid
      changeOptions.headers.appId = appId;
      this.hikLogger.debug('==================curl path=================');
      this.hikLogger.debug(path);
      this.hikLogger.debug('==================curl changeOptions=================');
      if (!changeOptions.file) {
        this.hikLogger.debug(changeOptions);
      } else {
        this.hikLogger.debug({
          desc: '这里是上传文件的日志，因为buffer会卡console，所以把相关信息隐藏掉了',
          headers: changeOptions.headers,
        });
      }
      // const changeOptionsForLog = Object.assign({}, changeOptions)
      // changeOptionsForLog.file && (changeOptionsForLog.file.fileBuffer = 'buffer太长了，这里先不展示了，否则会卡console')
      // changeOptionsForLog.stream && (changeOptionsForLog.stream._endData = changeOptionsForLog.stream._endData.toString())
      const res = await this.curl(path, changeOptions);
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
