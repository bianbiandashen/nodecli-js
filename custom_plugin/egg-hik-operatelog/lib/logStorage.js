"use strict"

class LogStorage{

    constructor() {
        this.map = new Map();
    }

    push(ctx,logDTO){
        this.map.set(ctx,logDTO);
    }

    get(ctx){
        const log = this.map.get(ctx) || null;
        return log;
    }

    pop(ctx){
        const log = this.map.get(ctx) || null;
        if(log){
            this.map.delete(ctx);
        }
        return log;
    }

    size(){
        return this.map.size;
    }

    clear(){
        this.map.clear();
    }
}

module.exports=new LogStorage();