'use strict';

const skip_url = /\/service\/rs|\/api-docs.*|\/autoconfig|\/configprops|\/dump|\/health|\/info|\/metrics.*|\/mappings|\/trace|\/swagger.*|.*\\.png|.*\\.css|.*\\.js|.*\\.html|\/favicon.ico|\/hystrix.stream|\/error/;
/**
 * egg-hik-tracer default config
 * @member Config#hikTracer
 * @property {String} SOME_KEY - some description
 */
exports.hikTracer = {
    installationIndex:1,
    serverIp:'127.0.0.1',
    client: {

    }
};


//中间件开启调用链拦截忽略前端http请求url
exports.tracerInterceptor = {
    ignore: skip_url
};

//中间件开启调用链拦截匹配rest接口前缀
exports.restInterceptor = {
    match: /\/service\/rs/
};
