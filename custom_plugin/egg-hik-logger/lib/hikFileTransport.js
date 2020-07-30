const FileTransport = require("egg-logger").FileTransport;
const moment = require("moment");

class HikFileTransport extends FileTransport {
  constructor(options, app) {
    super(options);
    this.app = app;
  }

  setCtx(ctx){
    this.ctx = ctx;
  }

  log(level, args, meta) {
    const prefixStr = this.buildFormat(level);
    let logArray = [];
    for (let arg of args) {
      if (arg instanceof Error) {
        let errorCode = arg.code ? ` [${arg.code}]` : "";
        let log = `${prefixStr}${errorCode} - ${arg.stack}`;
        logArray.push(log);
      } else {
        if (typeof arg === "object") {
          arg = JSON.stringify(arg);
        }
        let log = `${prefixStr} - ${arg}`;
        logArray.push(log);
      }
    }
    super.log(level, logArray, meta);
  }

  buildFormat(level) {
    const timeStr = `${moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ")}`;
    const serverName = `${this.app.config.serverName}`;
    const threadNameStr = `[${process.pid}]`;
    const urlStr = `[${this.ctx.request.url}]`;
    const traceSpan = this.app.traceSpan
      ? `<${this.app.traceSpan.traceId},${this.app.traceSpan.spanId}>`
      : "";
    return `${timeStr} ${level} ${serverName} ${threadNameStr} ${urlStr} ${traceSpan}`;
  }
}

module.exports = HikFileTransport;
