const Subscription = require('egg').Subscription;

const tokenStore = require('../consul/tokenLocalStorage');
const {
  genTokenex,
} = require('../../../../hikidentify/hikidentify');

class TokenRefresh extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '18m', // 18分钟间隔服务端token20分钟过期
      type: 'all',
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    tokenStore.setItem('Token', {
      Token: genTokenex(),
    });
  }
}

module.exports = TokenRefresh;
