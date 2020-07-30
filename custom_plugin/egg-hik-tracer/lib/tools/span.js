const uuidV4 = require('uuid/v4');
class Span{

    constructor(builder){
        this.traceId = builder.traceId;
        this.spanId = builder.spanId;
        this.name = builder.name;
        this.parentSpan = builder.parentSpan;
    }

    static createId() {
        return uuidV4().replace(/-/g,"");
    }

    static builder(){
        return new Span.Builder();
    }

    toTSString(){
        return `trace_id:"${this.traceId}",span_id:"${this.spanId}",span_name:"${this.name}"`;
    }

    toTEString(){
        return `trace_id:"${this.traceId}",span_id:"${this.spanId}"`;
    }

    toCSString(){
        return `trace_id:"${this.traceId}",span_id:"${this.spanId}",span_name:"${this.name}",parent_id:"${this.parentSpan.spanId}"`;
    }

    toCRString(){
        return `trace_id:"${this.traceId}",span_id:"${this.spanId}",parent_id:"${this.parentSpan.spanId}"`;
    }

    toSRString(){
        return `trace_id:"${this.traceId}",span_id:"${this.spanId}"`;
    }

}

Span.Builder = class{

    setTraceId(traceId){
        this.traceId = traceId;
        return this;
    }

    setSpanId(spanId){
        this.spanId = spanId;
        return this;
    }

    setName(name){
        this.name = name;
        return this;
    }

    setParentSpan(parentSpan){
        this.parentSpan = parentSpan;
        return this;
    }

    build(){
        return new Span(this);
    }
};

module.exports = Span;