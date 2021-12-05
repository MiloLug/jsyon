const operators = require('./operators.js');

class Interpreter {
    static entryTypeMethods = new Map();

    constructor(global, path, context, startFrom) {
        this.position = 0;
        this.prevPlace;
        this.curPlace = startFrom;
        this.path = path;
        this.context = context;

        this.global = global;
    }
    
    findStartElements(entry) {
        switch(entry){
            case "~>":
                this.curPlace = this.context;
                this.position++;
                break;
            case "global":
                this.curPlace = this.global;
                this.position++;
                break;
            default:
                this.curPlace = this.global;
        }
    }

    async processStringEntry(entry) {
        if(entry?.constructor === String && !isNaN(parseInt(entry))) {
            this.path[this.position] = +entry;
            return;
        }
        if(this.position === 0 && this.curPlace == undefined) {
            this.findStartElements(entry);
            return;
        }

        if(operators[entry]) {
            let place = this.prevPlace;
            let prevEntry = this.path[this.position-1];
            this.prevPlace = this.curPlace;
            this.curPlace = await operators[entry](this, place, prevEntry);
            this.position++;
            return;
        }

        if(this.curPlace != undefined)
            this.prevPlace = this.curPlace,
            this.curPlace = this.curPlace?.__get_attr__
                ? this.curPlace.__get_attr__(entry)
                : this.curPlace[entry];

        this.position++;
    }
    async processNumberEntry(entry) {
        if(this.position === 0 && this.curPlace == undefined)
            this.curPlace = {[entry]: entry};
        else
            this.processStringEntry(entry);
    }
    async processArrayEntry(entry) {
        let args = [];
        for (let i = 0, len = entry.length; i < len; i++){
            const item = entry[i];
            if (item?.constructor === Object) {
                if (item["@__unpack_arr_args"])
                    args.push(...(await this.processObject(item)));
                else
                    args.push(await this.processObject(item));
            } else
                args.push(item);
        }
        let tmp = this.curPlace;
        this.curPlace = await this.curPlace.apply(this.prevPlace, args);
        this.prevPlace = tmp;
        this.position++;
    }
    async processObjectEntry(entry) {
        this.prevPlace = this.curPlace;
        if(this.position === 0 && this.curPlace === undefined){
            this.findStartElements();
            
            this.prevPlace = this.curPlace;
            this.curPlace = await this.processObject(entry);
            this.position++;
            
            return;
        }
        if(this.curPlace !== undefined)
            this.curPlace = this.curPlace[
                await this.processObject(entry)
            ];
        this.position++;
    }
    async processObject(obj) {
        let ctx = undefined;
        
        if(obj["@__raw"]) { 
            if(obj["@__last"] !== undefined)
                return ["~>", "(as-context)", [{"@__last": obj["@__last"]}]];
            return obj["@__expr"];
        }

        if(obj["@__follow_ctx"])
            ctx = this.context;
        if(obj["@__expr"] !== undefined)
            return await new Interpreter(this.global, obj["@__expr"], ctx || this.prevPlace).run();
        if(obj["@__last"] !== undefined){
            if(obj["@__async"]) {
                const toHandle = [];
                toHandle = obj["@__last"].map(expr => new Interpreter(this.global, expr, ctx || this.prevPlace).run());
                await Promise.all(toHandle);
                return toHandle.length ? toHandle[toHandle.length - 1] : this.global.Null;
            }
            
            let ret;
            for(const expr of obj["@__last"])
                ret = await new Interpreter(this.global, expr, ctx || this.prevPlace).run();
            return ret;
        }
        let keys = Object.getOwnPropertyNames(obj);
        for(let key of keys){
            let data = obj[key];
            if(data != undefined && data.constructor === Object)
                obj[key] = await this.processObject(data);
        }
        return obj;
    }
    
    async run(){
        let fn;
        for(let entry; (entry = this.path[this.position]) !== undefined ; ){
            if(fn = Interpreter.entryTypeMethods.get(entry.constructor))
                await fn.call(this, entry);
            else
                this.position++;
        }
        return this.curPlace;
    }
};

Interpreter.entryTypeMethods.set(String, Interpreter.prototype.processStringEntry);
Interpreter.entryTypeMethods.set(Array, Interpreter.prototype.processArrayEntry);
Interpreter.entryTypeMethods.set(Object, Interpreter.prototype.processObjectEntry);
Interpreter.entryTypeMethods.set(Number, Interpreter.prototype.processNumberEntry);

module.exports = Interpreter;
