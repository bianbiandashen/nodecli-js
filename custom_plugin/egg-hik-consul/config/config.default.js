/*
 * @作者: bianlian
 * @创建时间: 2020-01-10 13:51:16
 * @Last Modified by:   bainlian
 * @Last Modified time: 2020-01-10 13:51:16
 */

'use strict';

/**
 * egg-egg-hik-consul default config
 * @member Config#consul
 * @property {String} SOME_KEY - some description
 */

exports.constantService = {
  APP: {
    BIC: 'bic',
    XAUTH_AUTHC: 'xauth-authc',
    EBG_SERVICE: 'ecca',
    XMAP: 'xmap-web',
  },
  PATH: {
    // 核心服务接口路径
    BIC_PRODUCT: '/bic/productService/v1/products', // 获取产品版本信息
    // xauth接口路径
    XAUTH_AUTHC_FINDUSER: '/xauth-authc/service/rs/userService/v1/user/', // 获取用户信息
    // xmap接口路径
    XMAP_INITCONFIG: '/xmap-web/service/rs/v1/xmapConfigService/fetchXmapInitConfig', // 获取地图初始化参数配置
    ECCA_TEST: '/ecca/api/v1/replenishManage/getReplenishInfoDetail',
    EBG_SERVICETYPE: 'eccaweb',
  },
};


// 中间件开启接口调用拦截匹配rest接口前缀
exports.consulInterceptor = {
  match: /\/service\/rs/,
};

// 是否需要开启token校验
exports.tokenCheck = {
  enable: true,
  checkex: true,
};
