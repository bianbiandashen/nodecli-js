const hikTracerLog = require('../../lib/hikTracerLog');
const pathMatching = require('egg-path-matching');

module.exports = (options, app) => {
    return async (ctx, next) => {
        if(!ignoreTrace(app,ctx)){
            hikTracerLog.traceStart(ctx.path);
        }

        await next();

        if(!ignoreTrace(app,ctx)){
            hikTracerLog.traceEnd();
        }
    }
};

function ignoreTrace(app,ctx){
    if(!app.config.skipTraceUrl || !app.config.skipTraceUrl.ignore || !app.config.skipTraceUrl.ignore.length === 0){
        return false;
    }
    const ignorePattern  = pathMatching({
        match:app.config.skipTraceUrl.ignore
    });
    return ignorePattern(ctx);
}
