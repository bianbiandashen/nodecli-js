'use strict';

const Subscription = require('egg').Subscription;
// const ip = require('../utils/ip');
const project = require('../utils/project');

class RegisterSubscription extends Subscription {
  static get schedule() {
    return {
      type: 'worker',
      immediate: true,
    };
  }

  async subscribe() {
    const { app } = this;
    //this.registerServer(app);
  }

  async registerServer(app) {
    const { config } = app.consul;
    const contextPath = app.config.contextPath;
    // 获取配置
    // const realPort = app.server.address().port;
    try {
      // const realIp = await ip.getRealIp(app);
      const projectName = project.getProjectName();
      const { name = projectName, address, port , check = {}, tags = [projectName] } = config;

      const { path, interval = '5s', notes = 'http service check', status = 'passing' } = check;
      if (path) {
        check.http = `http://${address}:${port}${contextPath}${path}`;
      } else {
        check.http = `http://${address}:${port}${contextPath}`;
      }
      const checkConfig = Object.assign({}, { interval, notes, status }, check);

      await app.consul.agent.service.register({
          id:`${name}-${address.replace(/\./g,"-")}-${port}`,
          name:name,
          enableTagOverride: false,
          tags:tags,
          check: checkConfig,
          address:address,
          port:port
      });
      app.logger.info('consul server register succeed');
    } catch (err) {
      // 向服务注册中心注册失败后
      app.logger.error('consul register failed', err);
      process.kill(process.ppid, 'SIGKILL');
    }
  }
}

module.exports = RegisterSubscription;
