const serviceLocalStorage = require('./serviceLocalStorage');
const watch = require('./watch');
const loadBalance = require('loadbalance');

class Discovery {
  constructor(app) {
    this.app = app;
  }

  async loadServiceAddress(name) {
    const services = await this._getService(name);
    const engine = loadBalance.random(services);
    return engine.pick();
  }

  /**
   *  从缓存获取健康的服务地址列表
   * @author caoyunfei
   * @date 2018/11/30 16:00
   * @param
   * @return
   */
  async _getService(name) {
    const {
      app,
    } = this;
    // 从缓存中获取列表
    const cacheServices = serviceLocalStorage.getItem(name);
    if (cacheServices.length > 0) {
      app.logger.debug(
        `consul cache service found，key:${name},value:${JSON.stringify(
          cacheServices
        )}`
      );
      return cacheServices;
    }
    // 如果缓存不存在，则获取远程数据
    const checks = await app.consul.health.checks(name);
    if (Object.keys(checks).length <= 0 || checks[0].length === 0) {
      throw new Error(`consul ${name} services is empty`);
    }
    const services = await app.consul.catalog.service.nodes(name);
    if (Object.keys(services).length <= 0 || services[0].length === 0) {
      throw new Error(`consul service ${name} not found`);
    }
    // 远程检查和服务数据写入缓存
    this._addServiceCache(name, checks[0], services[0]);

    const serviceIps = serviceLocalStorage.getItem(name);

    if (serviceIps && serviceIps.length > 0) {
      // 注册服务监听事件更新本地缓存
      this._watchServices(app, name);
    }
    return serviceIps;
  }

  /**
   *  远程检查和服务数据写入缓存
   * @author caoyunfei
   * @date 2018/11/30 16:01
   * @param
   * @return
   */
  _addServiceCache(serviceName, checks, services) {
    const passServices = [];
    for (const service of services) {
      for (const check of checks) {
        if (
          service.ServiceID === check.ServiceID &&
          check.Status === 'passing'
        ) {
          passServices.push(service);
        }
      }
    }
    if (passServices.length > 0) {
      serviceLocalStorage.setItem(serviceName, passServices);
    }
  }

  /**
   *  监听服务健康检查更新缓存
   * @author caoyunfei
   * @date 2018/11/30 16:01
   * @param
   * @return
   */
  _watchServices(app, name) {
    watch.watch(app, name, async (error, data) => {
      if (error) {
        throw new Error(`watch health check is error:${error}`);
      }
      if (serviceLocalStorage.getItem(data.name)) {
        serviceLocalStorage.removeItem(data.name);
      }
      const services = await app.consul.catalog.service.nodes(data.name);
      if (Object.keys(services).length <= 0) {
        throw new Error(`consul service ${name} not found`);
      }
      this._addServiceCache(data.name, data.checks, services[0]);
    });
  }
}

module.exports = Discovery;
