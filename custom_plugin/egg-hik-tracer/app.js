const hikTracerLog = require('./lib/hikTracerLog');
const initLineNum = require('./lib/tools/lineNum');
const curlInterceptor = require('./lib/reference/curlInterceptor');
module.exports = app => {
    //初始化系统构建行号全局变量
    initLineNum();

    //前端http请求调用链拦截器
    app.config.coreMiddleware.push('tracerInterceptor');

    //rest接口调用链拦截器
    app.config.coreMiddleware.push('restInterceptor');

    //curl调用拦截器，增加调用链追踪
    curlInterceptor(app);

    //初始化node_id
    hikTracerLog.init(app);
};

