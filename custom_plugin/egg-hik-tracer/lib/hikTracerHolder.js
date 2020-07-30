const cls = require('cls-hooked');
const NAME_SPACE = 'tracer';

class HikTracerHolder{

    constructor(){
        this.ns = cls.createNamespace(NAME_SPACE);
    }

    /**
     * 设置保存 trace start Span 但不记录 trace start and end 事件的标识符.通常用于controller作为rest接口服务
     * @author caoyunfei
     * @date 2019/1/7 19:26
     * @param
     * @return
     */
    setNoTracerStart(){
        const hikSpan = this.ns.get(NAME_SPACE) || new HikTracerHolder.HikSpan();
        hikSpan.setNoTraceStart(true);
    }

    noTracerStart(){
        const hikSpan = this.ns.get(NAME_SPACE) || new HikTracerHolder.HikSpan();
        return hikSpan.isNoTraceStart();
    }


    setTSSpan(tsSpan){
        this.ns.runPromise(async () => {
            const tracerNS = cls.getNamespace(NAME_SPACE);
            const hikSpan = tracerNS.get(NAME_SPACE) || new HikTracerHolder.HikSpan();
            hikSpan.setTSSpan(tsSpan);
            tracerNS.set(NAME_SPACE, hikSpan);
            return Promise.resolve();
        });
    }

    getTSSpan(){
        const hikSpan = this.ns.get(NAME_SPACE) || new HikTracerHolder.HikSpan();
        return hikSpan.getTSSpan();
    }

    setSRSpan(srSpan){
        this.ns.runPromise(async () => {
            const tracerNS = cls.getNamespace(NAME_SPACE);
            const hikSpan = tracerNS.get(NAME_SPACE) || new HikTracerHolder.HikSpan();
            hikSpan.setSRSpan(srSpan);
            tracerNS.set(NAME_SPACE, hikSpan);
            return Promise.resolve();
        });
    }

    getSRSpan(){
        const hikSpan = this.ns.get(NAME_SPACE) || new HikTracerHolder.HikSpan();
        return hikSpan.getSRSpan();
    }

    setCSSpan(csSpan){
        const hikSpan = this.ns.get(NAME_SPACE) || new HikTracerHolder.HikSpan();
        hikSpan.setCSSpan(csSpan);
    }

    getCSSpan(){
        const hikSpan = this.ns.get(NAME_SPACE) || new HikTracerHolder.HikSpan();
        return hikSpan.getCSSpan();
    }

    getTraceSpan(){
        const hikSpan = this.ns.get(NAME_SPACE) || new HikTracerHolder.HikSpan();
        return hikSpan.getTraceSpan();
    }

}

HikTracerHolder.HikSpan = class {

    constructor() {

    }

    setNoTraceStart(noTraceStart){
        this.noTraceStart = noTraceStart;
    }

    isNoTraceStart(){
        return this.noTraceStart || false;
    }

    setTSSpan(tsSpan){
        this.tsSpan = tsSpan;
        this.traceSpan = tsSpan;
    }

    getTSSpan(){
        return this.tsSpan;
    }

    setCSSpan(csSpan){
        this.csSpan = csSpan;
        this.traceSpan = csSpan;
    }

    getCSSpan(){
        return this.csSpan;
    }

    setSRSpan(srSpan){
        this.srSpan = srSpan;
        this.traceSpan = srSpan;
    }

    getSRSpan(){
        return this.srSpan;
    }

    getTraceSpan(){
        return this.traceSpan;
    }

};

module.exports = new HikTracerHolder();