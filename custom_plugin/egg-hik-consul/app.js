'use strict';

const tokenStore = require('./app/consul/tokenLocalStorage');
const {
  genTokenex,
} = require('../../hikidentify/hikidentify');
module.exports = app => {
  // rest接口通过consul调用时拦截器
  app.config.coreMiddleware.push('consulInterceptor');

  app.beforeStart(async () => {
    // app.addSingleton('consul', createConsul); //挂载consul注册对象
    // createHealthRouter(app); //创建健康检查路径
    tokenStore.setItem('Token', {
      Token: genTokenex(),
    }); // 初始化token值
  });

  app.beforeClose(async () => {
    // const {
    //         name = project.getProjectName(),
    //         address,
    //         port
    //     } = app.consul.config;
    // const id = `${name}-${address.replace(/\./g, '-')}-${port}`;
    // //app.consul.agent.service.deregister(id);
    // app.logger.info('服务关闭解除注册');
  });
};
