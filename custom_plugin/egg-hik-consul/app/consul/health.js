const router = require('koa-router')();

function createHealthRouter(app) {
    const contextPath = app.config.contextPath;
    const healthUrl = app.config.consul.client.server.check.path;

    router.get(`${contextPath}${healthUrl}`, async (ctx, next) => {
        ctx.body = {
            description: "Composite Discovery Client",
            status:"UP"
        };
        ctx.status = 200;
    });
    app.use(router.routes());
}

module.exports = createHealthRouter;