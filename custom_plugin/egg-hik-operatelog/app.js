const logStorage = require('./lib/logStorage');

module.exports = app => {
    app.config.coreMiddleware.push('logInterceptor');
    app.addSingleton('hikOperatelog', createHikOperatelog);

};

function createHikOperatelog(config, app){
    return logStorage;
}


