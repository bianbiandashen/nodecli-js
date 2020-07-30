const Logger = require('egg-logger').Logger;
const HikConsoleTransport = require('./hikConsoleTransport');
const HikFileTransport = require('./hikFileTransport');
const HikFileErrorTransport = require('./hikFileErrorTransport');

module.exports = function(app,ctx){
    const logger = new Logger();

    app.hikFileDebugTransport.setCtx(ctx);
    app.hikFileErrorTransport.setCtx(ctx);
    app.hikConsoleTransport.setCtx(ctx);

    logger.set('debugFile', app.hikFileDebugTransport);
    logger.set('errorFile', app.hikFileErrorTransport);
    logger.set('console', app.hikConsoleTransport);

    return logger;
};

