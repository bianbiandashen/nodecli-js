'use strict';
const HikConsoleTransport = require('./lib/hikConsoleTransport');
const HikFileTransport = require('./lib/hikFileTransport');
const HikFileErrorTransport = require('./lib/hikFileErrorTransport');

module.exports = app => {
    const {level, dir} = app.config.logger;
    const appLogDebugName = `${app.config.componentID}.${app.config.serverName}.debug.log`;
    const logDebugPath = `${dir}/${appLogDebugName}`;
    const appLogErrorName = `${app.config.componentID}.${app.config.serverName}.error.log`;
    const logErrorPath = `${dir}/${appLogErrorName}`;

    let debugTransport = new HikFileTransport({
        level: level,
        file: logDebugPath
    }, app);


    let errorTransport = new HikFileErrorTransport({
        level: level,
        file: logErrorPath
    }, app);

    let consoleTransport = new HikConsoleTransport({
        level: level
    }, app);

    app.hikFileDebugTransport = debugTransport;
    app.hikFileErrorTransport = errorTransport;
    app.hikConsoleTransport = consoleTransport;
};

