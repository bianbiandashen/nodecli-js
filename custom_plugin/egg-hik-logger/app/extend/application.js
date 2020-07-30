const hikLogger = require('../../lib/hikLogger');
module.exports = {
    get hikLogger() {
        const ctx = this.createAnonymousContext();
        return hikLogger(this,ctx);
    }
};