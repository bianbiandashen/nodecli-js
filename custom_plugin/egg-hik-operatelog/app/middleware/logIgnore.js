module.exports = (options, app) => {
    return async (ctx, next) => {
        
        const {hikOperatelog} = ctx.app;
        const logDTO = hikOperatelog.get(ctx);
        if(logDTO){
            logDTO.setIgnore(true);
        }
        await next();
    }
};