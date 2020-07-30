const hikTracerHolder = require("../../lib/hikTracerHolder");
module.exports = {
    get traceSpan() {
        return hikTracerHolder.getTraceSpan();
    }
};
