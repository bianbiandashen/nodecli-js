/* eslint-disable no-bitwise */
/* eslint-disable default-case */
/* eslint-disable strict */
const hikTracerLog = require('../hikTracerLog');
const hikTracerHolder = require('../hikTracerHolder');
const OTHER_ERROR = [ '0x00052301', 'Other error.' ];
// edit by lrx
const Utf8ArrayToStr = function(array) {
  let out, 
i, 
c;
  let char2, 
char3;

  out = '';
  const len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    // eslint-disable-next-line no-bitwise
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }
  return out;
};
const resDataTrans = function(resp) {
  if (resp && resp.res.data) {
    if (Buffer.isBuffer(resp.res.data)) {
      try {
        resp.res.data = JSON.parse(Utf8ArrayToStr(resp.res.data));
      } catch (e) {
        resp.res.data = Utf8ArrayToStr(resp.res.data);
      }
    }
  }
};

module.exports = app => {
  app.httpclient.on('request', req => {
    hikTracerLog.clientSend(req.url);
    const csSpan = hikTracerHolder.getCSSpan();
    if (csSpan) {
      if (req.args.headers) {
        req.args.headers.trace_id = csSpan.traceId;
        req.args.headers.span_id = csSpan.spanId;
      }
    }
  });
  app.httpclient.on('response', result => {
    // edit by bian
    resDataTrans(result);
    if (result.res && result.res.data) {
      const responseBaseResult = result.res.data;
      if (typeof responseBaseResult === 'object') {
        if (responseBaseResult.code === '0' || responseBaseResult.type === 0) {
          hikTracerLog.clientReceiveSucceed();
        } else {
          const { code, msg } = responseBaseResult;
          hikTracerLog.clientReceiveFailed(msg, code);
        }
      } else {
        // 不是json对象格式的结果，只要http响应码是200，就按照正常返回处理
        hikTracerLog.clientReceiveSucceed();
      }
    } else {
      hikTracerLog.clientReceiveFailed(OTHER_ERROR[1], OTHER_ERROR[0]);
    }
  });
};
