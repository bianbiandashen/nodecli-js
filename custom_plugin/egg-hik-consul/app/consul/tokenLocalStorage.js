/**
 * 提供service 缓存
 */
class TokenLocalStorage {
    constructor() {
        this.localStorage = new Map();
    }
    getItem(key) {
        return this
            .localStorage
            .get(key) || {};
    }
    setItem(key, value = {}) {
        this
            .localStorage
            .set(key, value);
    }
    removeItem(key) {
        this
            .localStorage
            .delete(key);
    }
    clear() {
        this
            .localStorage
            .clear();
    }
}
module.exports = new TokenLocalStorage();