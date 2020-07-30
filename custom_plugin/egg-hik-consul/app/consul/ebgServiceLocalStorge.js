/**
 * 提供service 缓存
 */
class EbgServiceLocalStorage {
    constructor() {
      this.localStorage = new Map();
    }
    getItem(key) {
    return this
      .localStorage
      .get(key) || [];
    }
    setItem(key, value = []) {
      const ipValues = value.map(item => {
        // 获取Ip与Port端口
      return `http://${item.ServiceAddress}:${item.ServicePort}`;
      });
      this.localStorage.set(key, ipValues);
    }
    removeItem(key) {
    this
      .localStorage
      .delete(key);
    }
    clear() {
      this.localStorage.clear();
    }
}
module.exports = new EbgServiceLocalStorage();

