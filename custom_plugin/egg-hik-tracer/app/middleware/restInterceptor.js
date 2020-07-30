const hikTracerLog = require('../../lib/hikTracerLog');
const pathMatching = require('egg-path-matching');

const OTHER_ERROR = ["0x00052301","Other error."];

module.exports = (options, app) => {
    return async (ctx, next) => {
        if(!ignoreTrace(app,ctx)){
            const traceId = ctx.req.headers.trace_id;
            const spanId = ctx.req.headers.span_id;

            if(traceId && spanId){
                hikTracerLog.serverReceived(ctx.path,traceId,spanId);
                hikTracerLog.traceStart(ctx.path);
                try{
                    await next();
                    hikTracerLog.serverSendSucceed();
                }catch (err) {
                    handleErrorRequestEndLog(ctx,err);
                }
            }else{
                try{
                    await next();
                }catch (err) {
                    handleErrorRequestEnd(ctx,err);
                }
            }
        }else{
            try{
                await next();
            }catch (err) {
                handleErrorRequestEnd(ctx,err);
            }
        }
    };
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

function handleErrorRequestEndLog(ctx,err){
    //如果是自定义的bussinessError
    if(err.code){
        hikTracerLog.serverSendFailed(err.message,err.code);
        ctx.hikLogger.error(err);
        fail(ctx,err.code,err.message);
    }else{
        let message = err.message || OTHER_ERROR[1];
        hikTracerLog.serverSendFailed(message,OTHER_ERROR[0]);
        err.code = OTHER_ERROR[0];
        if (!err.message) {
            err.message = message;
        }
        ctx.hikLogger.error(err);
        fail(ctx,OTHER_ERROR[0],message);
    }

}

function handleErrorRequestEnd(ctx,err){
    //如果是自定义的bussinessError
    if(err.code){
        ctx.hikLogger.error(err.code,err.stack);
        fail(ctx,err.code,err.message);
    }else{
        let message = err.message || OTHER_ERROR[1];
        ctx.hikLogger.error(OTHER_ERROR[0],err.stack);
        fail(ctx,OTHER_ERROR[0],message);
    }

}

function fail(ctx,code,msg){
    ctx.response.headers.code = code;
    ctx.response.headers.notation = msg;
    ctx.body = {
        type: -1,
        code:code,
        msg:msg
    };
    ctx.status = 500;
}

