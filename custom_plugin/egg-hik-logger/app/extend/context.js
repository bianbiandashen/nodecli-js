const hikLogger = require('../../lib/hikLogger');
module.exports = {
    get hikLogger() {
        return hikLogger(this.app,this);
    }
};