import Global from './Global.js';
import Operators from './Operators.js';

export default class Interpreter {
    constructor(path, context, startFrom) {
        this.entryTypeMethods = new Map();
        this.entryTypeMethods.set(String, this.processStringEntry.bind(this));
        this.entryTypeMethods.set(Array, this.processArrayEntry.bind(this));
        this.entryTypeMethods.set(Object, this.processObjectEntry.bind(this));
        this.entryTypeMethods.set(Number, this.processStringEntry.bind(this));

        this.position = 0;
        this.prevPlace;
        this.curPlace = startFrom;
        this.path = path;
        this.context = context;
    }
    
    findStartElements(entry) {
        switch(entry){
            case "this":
                this.curPlace = this.context;
                this.position++;
                break;
            case "global":
                this.curPlace = Global;
                this.position++;
                break;
            default:
                this.curPlace = Global;
        }
    }

    processStringEntry(entry) {
        if(this.position === 0 && this.curPlace == undefined){
            this.findStartElements(entry);
            return;
        }

        if(Operators[entry]) {
            let place = this.prevPlace;
            let prevEntry = this.path[this.position-1];
            this.prevPlace = this.curPlace;
            this.curPlace = (...args) => Operators[entry](
                this, place, prevEntry, args
            );
            this.position++;
            return;
        }
        if(this.curPlace != undefined)
            this.prevPlace = this.curPlace,
            this.curPlace = this.curPlace[entry];
        this.position++;
    }
    processArrayEntry(entry) {
        let args = [];
        for(let item of entry){
            if(item != undefined && item.constructor === Object)
                args.push(this.processObject(item));
            else
                args.push(item);
        }
        let tmp = this.curPlace;
        this.curPlace = this.curPlace.apply(this.prevPlace, args);
        this.prevPlace = tmp;
        this.position++;
    }
    processObjectEntry(entry) {
        this.prevPlace = this.curPlace;
        if(this.position === 0 && this.curPlace == undefined){
            this.findStartElements();
            
            this.prevPlace = this.curPlace;
            this.curPlace = this.processObject(entry);
            this.position++;
            
            return;
        }
        if(this.curPlace != undefined)
            this.curPlace = this.curPlace[
                this.processObject(entry)
            ];
        this.position++;
    }
    processObject(obj) {
        let ctx = undefined;
        
        if(obj["@__raw"]) { 
            if(obj["@__last"] !== undefined)
                return ["this", "(as-context)", [{"@__last": obj["@__last"]}]];
            return obj["@__expr"];
        }

        if(obj["@__follow_ctx"])
            ctx = this.context;
        if(obj["@__expr"] !== undefined)
            return (new Interpreter(obj["@__expr"], ctx || this.prevPlace)).run();
        if(obj["@__last"] !== undefined){
            let ret;
            for(let expr of obj["@__last"])
                ret = (new Interpreter(expr, ctx || this.prevPlace)).run();
            return ret;
        }
        let keys = Object.getOwnPropertyNames(obj);
        for(let key of keys){
            let data = obj[key];
            if(data != undefined && data.constructor === Object)
                obj[key] = this.processObject(data);
        }
        return obj;
    }
    
    run(){
        let fn;
        for(let entry; entry = this.path[this.position] ; ){
            if(fn = this.entryTypeMethods.get(entry.constructor))
                fn(entry);
            else
                this.position++;
        }
        return this.curPlace;
    }
}

