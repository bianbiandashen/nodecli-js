'use strict';
/**
 * egg-hik-operatelog default config
 * @member Config#hikOperatelog
 * @property {String} SOME_KEY - some description
 */
exports.hikOperatelog = {
    client: {

    }
};

//中间件匹配.do的url请求开启日志拦截
exports.logInterceptor = {
    match(ctx) {
        return ctx.path.includes('.do');
    },
};


