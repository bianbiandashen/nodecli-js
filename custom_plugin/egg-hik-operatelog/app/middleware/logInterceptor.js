const OperateLogDTO = require('../../lib/operateLogDTO');
const moment = require('moment');

module.exports = (options, app) => {
  return async (ctx, next) => {

    preHandle(ctx, app);
    await next();
    postHandle(ctx, app);
  };
};

/**
 *  在进入controller路由前预处理部分日志字段
 * @author caoyunfei
 * @date 2018/12/11 9:18
 * @param
 * @return
 */
function preHandle(ctx, app) {

  const { hikOperatelog } = app;

  let personId = '';
  if (ctx.session && ctx.session.cas && ctx.session.cas.userinfo) {
    const principals = ctx.session.cas.userinfo.split('&&');
    personId = principals[0];
  }
  const logDTO = new OperateLogDTO();

  logDTO.setIp(ctx.ip);
  logDTO.setOperationTime(
    moment(new Date()).format('YYYY-MM-DDTHH:mm:ss.SSSZ')
  );
  logDTO.setServiceId(app.config.serverName);
  logDTO.setComponentId(app.config.componentID);
  logDTO.setTerminalType('0');
  logDTO.setPersonId(personId);

  hikOperatelog.push(ctx, logDTO);
}

/**
 *  在controller执行完后将一次请求的日志写入运管指定采集的自定义日志文件
 * @author caoyunfei
 * @date 2018/12/11 9:20
 * @param
 * @return
 */
function postHandle(ctx, app) {
  const { hikOperatelog } = app;
  const logDTO = hikOperatelog.pop(ctx);
  if (logDTO && !logDTO.ignore && ctx.status !== 404) {

    if (!logDTO.action && !logDTO.actionDetail) {
      logDTO.setActionDetail(ctx.request.url);
    }
    // 增加调用链的traceId
    logDTO.setTraceId(ctx.traceSpan ? ctx.traceSpan.traceId:'');
    app.getLogger('hikOperateLogger').info(logDTO.toString());
  }
}
