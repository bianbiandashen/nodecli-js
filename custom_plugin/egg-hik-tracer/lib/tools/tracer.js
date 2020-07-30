const Span = require('./span');

class Tracer {

    static createRootSpan(name) {
        const traceId = Span.createId();
        const spanId = Span.createId();
        return Tracer.createSpan(name, traceId, spanId);
    }

    static createRootSpan2(name, traceId) {
        const spanId = Span.createId();
        return Tracer.createSpan(name, traceId, spanId);
    }

    static createSpan(name, traceId, spanId, ...parentSpan) {
        let span;
        if (parentSpan.length > 0) {
            span = Span.builder().setTraceId(traceId)
                .setSpanId(spanId)
                .setName(name)
                .setParentSpan(parentSpan[0])
                .build();
        } else {
            span = Span.builder().setName(name).setTraceId(traceId).setSpanId(spanId).build();
        }
        return span;
    }

    static inheritanceCreateSpan(name,parentSpan){
        if(!parentSpan){
            return Tracer.createRootSpan(name);
        }

        return Tracer.createSpan(name,parentSpan.traceId,Span.createId(),parentSpan);
    }
}

module.exports = Tracer;