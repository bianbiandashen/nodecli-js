'use strict';
const constants = require('constants');

function Uint8ArrayToString(fileData) {
  let dataString = '';
  for (let i = 0; i < fileData.length; i++) {
    dataString += String.fromCharCode(fileData[i]);
  }

  return dataString;
}
class DisCoveryFun {
  constructor(_this) {
    this.call = _this;
  }
  async loadEgbServiceAddress(name, serviceType, options, path) {
    // console.log('thiscall==========================', this.call.app.config);
    const consul =
      (this.call && this.call.app && this.call.app.config && this.call.app.config.consul) ||
      (this.call && this.call.config && this.call.config.consul);
    // /svrService/v2/service/{componentId}/{serviceType}
    const { cibServerIp, bicContext, cibServerPort, protocol } = consul;
    if (name === 'centerService' && serviceType === 'centerService') {
      return `${protocol}://${cibServerIp}:${cibServerPort}${bicContext}`;
    }
    const getComponentIpService = consul.getComponentIpService;
    // const { getComponentIpService } = _this.config.consul;

    const centerAddresParam = await this._getEbgService(
      name,
      serviceType,
      getComponentIpService,
      options,
      this.call
    );
    if (centerAddresParam && centerAddresParam.data) {
      const configs =
        centerAddresParam.data && centerAddresParam.data.data && centerAddresParam.data.data.configs;
      let context;
      if (configs) {
        for (const item of configs) {
          if (item.key === '@context') {
            context = item.value;
            break;
          }
        }
      }
      const address =
        centerAddresParam.data && centerAddresParam.data.data && centerAddresParam.data.data.address;
      if (address && address.length > 0) {
        const { ip, netprotocol, port } = address[0];
        if (context) {
          let url;
          const reg = new RegExp('^' + context);
          if (reg.test(path)) {
            url = `${netprotocol}://${ip}:${port}`;
          } else {
            url = `${netprotocol}://${ip}:${port}${context}`;
          }
          return url;
        }
        return `${netprotocol}://${ip}:${port}`;
      }
    } else {
      throw new Error('组件间寻址失败');
    }
  }

  // 用于upm 的核心服务寻址
  async loadUpmSeviceAddress(name, serviceType, options, path) {
    const consul =
      (this.call && this.call.app && this.call.app.config && this.call.app.config.consul) ||
      (this.call && this.call.config && this.call.config.consul);
    // const consul = this.call.app && this.call.app.config && this.call.app.config.consul;
    const getComponentIpService = consul && consul.getComponentIpService;
    // const { getComponentIpService } = _this.config.consul;
    const centerAddresParam = await this._getEbgService(
      name,
      serviceType,
      getComponentIpService,
      options,
      this.call
    );

    // const configs = centerAddresParam.data && centerAddresParam.data.data && centerAddresParam.data.data.configs;
    // let context;
    // for (const item of configs) {
    //   if (item.key === '@context') {
    //     context = item.value;
    //     break;
    //   }
    // }
    if (centerAddresParam && centerAddresParam.res) {
      const UpmRes = centerAddresParam.res;

      const { remoteAddress, remotePort } = UpmRes;
      let url;
      // const reg = new RegExp('^' + context);
      // if (reg.test(path)) {
      url = `http://${remoteAddress}:${remotePort}`;
      // } else {
      //   url = `https://${remoteAddress}:${remotePort}${context}`;
      // }

      return url;
    }
  }
  async _getEbgService(name, serviceType, getComponentIpService, options, _this) {
    // console.log('=================ddd', _this);
    const consul =
      (_this && _this.app && _this.app.config && _this.app.config.consul) ||
      (_this && _this.config && _this.config.consul);
    // const consul = _this.app && _this.app.config && _this.app.config.consul

    const {
      cibServerIp,

      cibServerPort,
      protocol,
    } = consul;

    const path = `${protocol}://${cibServerIp}:${cibServerPort}${getComponentIpService
      .replace('{componentId}', name)
      .replace('{serviceType}', serviceType)}`;
    // const _options = options;
    // _options.data = {};
    const changeOptions = Object.assign(
      {},
      {
        headers: {
          Token: options.headers.Token,
          'content-type': 'application/json',
        },
        rejectUnauthorized: false,
        secureOptions: constants.SSL_OP_NO_TLSv1,
        method: 'GET',
      }
    );
    // debugger;
    let clonedStream;

    const result = await _this.curl(path, changeOptions);

    if (result && result.data) {
      if (Buffer.isBuffer(result.data)) {
        result.data = JSON.parse(Uint8ArrayToString(result.data));
      }
      if (result.status === 403) {
        throw new Error('寻址核心服务失败，请检查注册表是否已经注册');
      }
      return result;
    }
    throw new Error('寻址核心服务失败，请检查注册表是否已经注册');
  }
}
module.exports = DisCoveryFun;

// 寥若星保留
// const constants = require('constants');

// function Uint8ArrayToString(fileData) {
//   let dataString = '';
//   for (let i = 0; i < fileData.length; i++) {
//     dataString += String.fromCharCode(fileData[i]);
//   }

//   return dataString;
// }
// class DisCoveryFun {
//   constructor(_this) {
//     this.call = _this;
//   }
//   async loadEgbServiceAddress(name, serviceType, options) {
//     // /svrService/v2/service/{componentId}/{serviceType}

//     const getComponentIpService =
//       this.call &&
//       this.call.config &&
//       this.call.config.consul &&
//       this.call.config.consul.getComponentIpService;
//     // const { getComponentIpService } = _this.config.consul;
//     const centerAddresParam = await this._getEbgService(
//       name,
//       serviceType,
//       getComponentIpService,
//       options,
//       this.call
//     );
//     console.log('centerAddresParam.data', centerAddresParam.res);
//     if (centerAddresParam && centerAddresParam.res) {
//       const {
//         remoteAddress,
//         remotePort,

//       } = centerAddresParam.res;
//       const url = `https://${remoteAddress}:${remotePort}`;
//       return url;
//       // const address = centerAddresParam.data && centerAddresParam.data.data && centerAddresParam.data.data.address;
//       // if (address && address.length > 0) {

//       // }
//     }
//   }

//   async _getEbgService(
//     name,
//     serviceType,
//     getComponentIpService,
//     options,
//     _this
//   ) {
//     const {
//       cibServerIp,
//     } = _this.config.consul;

//     const path = `${cibServerIp}${getComponentIpService
//       .replace('{componentId}', name)
//       .replace('{serviceType}', serviceType)}`;
//     const _options = options;
//     // _options.data = {};
//     const changeOptions = Object.assign({}, {
//       headers: {
//         Token: options.headers.Token,
//         'content-type': 'application/json',
//       },
//       rejectUnauthorized: false,
//       secureOptions: constants.SSL_OP_NO_TLSv1,
//       // method: 'GET',
//     });
//     console.log(changeOptions);
//     const result = await _this.curl(path, changeOptions);
//     if (result && result.data) {
//       if (Buffer.isBuffer(result.data)) {
//         result.data = JSON.parse(Uint8ArrayToString(result.data));
//       }

//       return result;
//     }
//   }
// }
// module.exports = DisCoveryFun;
