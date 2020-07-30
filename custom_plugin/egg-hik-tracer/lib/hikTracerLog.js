const hikTracerHolder = require('./hikTracerHolder');
const actionConst = require('./tools/actionConst');
const Tracer = require('./tools/tracer');
const Span = require('./tools/span');

class HikTracerLog {
  /**
     * 初始化node id
     */
  init(app) {
    this.app = app;
    const { componentID, serverName, hikTracer } = app.config;
    if (app.config.service && app.config.service.instance) {
      this.nodeId = `${componentID}.${app.config.service.instance}@${app.config.service.address}`;
    } else {
      this.nodeId = `${componentID}.${serverName}.${hikTracer.installationIndex}@${hikTracer.serverIp}`;
    }
  }

  /**
     *  trace start事件
     */
  traceStart(name) {
    if (hikTracerHolder.getTSSpan()) { // 如果存在trace start span，则不能继续执行直接结束
      this.app.logger.debug('already exists trace start Span,can\'t create new trace start Span');
      return;
    }
    const tsName = name || Span.createId();
    const srSpan = hikTracerHolder.getSRSpan();
    let tsSpan;
    if (srSpan) { // 如果有SR事件，是调用链的其中一个节点，不需要trace start事件
      tsSpan = Tracer.createRootSpan2(tsName, srSpan.traceId);
      hikTracerHolder.setTSSpan(tsSpan);
      hikTracerHolder.setNoTracerStart();
    } else {
      tsSpan = Tracer.createRootSpan(tsName);
      hikTracerHolder.setTSSpan(tsSpan);
      this._traceStartLog(tsSpan);
    }

  }

  /**
     *  trace end事件
     */
  traceEnd() {
    const tsSpan = hikTracerHolder.getTSSpan();
    if (!tsSpan) {
      this.app.logger.debug('don\'t exists trace start, can\'t log traceEnd logEvent');
      return;
    }

    if (!hikTracerHolder.noTracerStart()) { // 当处于调用链中的一环 不需要记录tracer end事件
      this._traceEndLog(tsSpan);
    }


  }

  /**
     *  client send事件
     */
  clientSend(name) {
    let span = hikTracerHolder.getSRSpan();
    if (!span) {
      span = hikTracerHolder.getTSSpan();
    }
    if (!span) {
      this.app.logger.debug("don't exists trace start, can't log client start logEvent");
      return;
    }
    const csSpan = Tracer.inheritanceCreateSpan(name, span);
    hikTracerHolder.setCSSpan(csSpan);
    this._clientSendLog(csSpan);
  }

  /**
     * client receive 成功接收响应
     */
  clientReceiveSucceed() {
    const csSpan = hikTracerHolder.getCSSpan();
    if (!csSpan) {
      this.app.logger.debug("don't exists client send, can't log client receive logEvent");
      return;
    }
    this._clientReceiveSucceedLog(csSpan);
  }

  /**
     * client receive 失败接收响应
     */
  clientReceiveFailed(notation, errorCode) {
    const csSpan = hikTracerHolder.getCSSpan();
    if (!csSpan) {
      this.app.logger.debug("don't exists client send, can't log client receive logEvent");
      return;
    }
    this._clientReceiveFailedLog(csSpan, notation, errorCode);
  }

  /**
     * server receive作为服务端接收事件
     */
  serverReceived(name, traceId, spanId) {
    const srSpan = Tracer.createSpan(name, traceId, spanId);
    hikTracerHolder.setSRSpan(srSpan);
    this._serverReceiveLog(srSpan);
  }

  /**
     * server send作为服务端成功返回事件
     */
  serverSendSucceed() {
    const srSpan = hikTracerHolder.getSRSpan();
    if (!srSpan) {
      this.app.logger.debug("don't exists server received, can't log server send logEvent");
      return;
    }
    this._serverSendSucceedLog(srSpan);
  }

  /**
     * server send作为服务端失败返回事件
     */
  serverSendFailed(notation, errorCode) {
    const srSpan = hikTracerHolder.getSRSpan();
    if (!srSpan) {
      this.app.logger.debug("don't exists server received, can't log server send logEvent");
      return;
    }
    this._serverSendFailedLog(srSpan, notation, errorCode);
  }


  /**
     *  打印trace start日志
     */
  _traceStartLog(tsSpan) {
    const log = `[${__filename}:${__line + 1}] - node_id:"${this.nodeId}",${tsSpan.toTSString()},action:"${actionConst.TS}"`;
    this.app.getLogger('hikDtsLogger').info(log);
  }

  /**
     *  打印trace end日志
     */
  _traceEndLog(tsSpan) {
    const log = `[${__filename}:${__line + 1}] - node_id:"${this.nodeId}",${tsSpan.toTEString()},action:"${actionConst.TE}"`;
    this.app.getLogger('hikDtsLogger').info(log);
  }

  /**
     *  打印client send日志
     */
  _clientSendLog(csSpan) {
    const log = `[${__filename}:${__line + 1}] - node_id:"${this.nodeId}",${csSpan.toCSString()},action:"${actionConst.CS}"`;
    this.app.getLogger('hikDtsLogger').info(log);
  }

  /**
     *  打印client receive成功日志
     */
  _clientReceiveSucceedLog(csSpan) {
    const log = `[${__filename}:${__line + 1}] - node_id:"${this.nodeId}",${csSpan.toCRString()},action:"${actionConst.CR}"`;
    this.app.getLogger('hikDtsLogger').info(log);
  }

  /**
     *  打印client receive失败日志
     */
  _clientReceiveFailedLog(csSpan, notation, errorCode) {

    const log = `[${__filename}:${__line + 1}] - node_id:"${this.nodeId}",${csSpan.toCRString()},notation:"${notation}",code:"${errorCode}",action:"${actionConst.CR}"`;
    this.app.getLogger('hikDtsLogger').info(log);
  }

  /**
     *  打印server receive事件日志
     */
  _serverReceiveLog(srSpan) {
    const log = `[${__filename}:${__line + 1}] - node_id:"${this.nodeId}",${srSpan.toSRString()},action:"${actionConst.SR}"`;
    this.app.getLogger('hikDtsLogger').info(log);
  }

  /**
     *  打印server send success事件日志
     */
  _serverSendSucceedLog(srSpan) {
    const log = `[${__filename}:${__line + 1}] - node_id:"${this.nodeId}",${srSpan.toSRString()},action:"${actionConst.SS}"`;
    this.app.getLogger('hikDtsLogger').info(log);
  }

  /**
     *  打印server send fail事件日志
     */
  _serverSendFailedLog(srSpan, notation, errorCode) {
    const log = `[${__filename}:${__line + 1}] - node_id:"${this.nodeId}",${srSpan.toSRString()},action:"${actionConst.SS}",notation:"${notation}",code:"${errorCode}"`;
    this.app.getLogger('hikDtsLogger').info(log);
  }


}

module.exports = new HikTracerLog();
