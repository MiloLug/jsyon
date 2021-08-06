import Global from './Global.js';

export default class Interpreter {
    constructor(path, context, startFrom) {
        this.entryTypeMethods = new Map();
        this.entryTypeMethods.set(String, this.processStringEntry.bind(this));
        this.entryTypeMethods.set(Array, this.processArrayEntry.bind(this));
        this.entryTypeMethods.set(Object, this.processObjectEntry.bind(this));
        this.entryTypeMethods.set(Number, this.processStringEntry.bind(this));
        
        this.operators = new Map();
        this.operators.set("(new)", this.operatorNew.bind(this));
        this.operators.set("(as-context)", this.operatorAsContext.bind(this));
        this.operators.set("(through)", this.operatorThrough.bind(this));
        this.operators.set("(then-else)", this.operatorThenElse.bind(this));
        this.operators.set("(else)", this.operatorElse.bind(this));
        this.operators.set("(then)", this.operatorThen.bind(this));
	this.operators.set("(map)", this.operatorMap.bind(this));
	this.operators.set("(reduce)", this.operatorReduce.bind(this));

        this.operators.set("=", this.operatorAssign.bind(this));
        this.operators.set("+=", this.operatorPlusAssign.bind(this));
        this.operators.set("-=", this.operatorMinusAssign.bind(this));
        this.operators.set("/=", this.operatorDivAssign.bind(this));
        this.operators.set("*=", this.operatorMulAssign.bind(this));
        this.operators.set("+", this.operatorPlus.bind(this));
        this.operators.set("-", this.operatorMinus.bind(this));
        this.operators.set("/", this.operatorDiv.bind(this));
        this.operators.set("*", this.operatorMul.bind(this));
        
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

        if(this.operators.has(entry)) {
            let place = this.prevPlace;
            let prevEntry = this.path[this.position-1];
            this.prevPlace = this.curPlace;
            this.curPlace = (...args) => this.operators.get(entry)(
                place, prevEntry, args
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

    operatorAssign(obj, entry, args) {
        obj[entry] = args[0];
        return args[0];
    }
    operatorPlusAssign(obj, entry, args) {
        obj[entry] += args[0];
        return obj[entry];
    }
    operatorMinusAssign(obj, entry, args) {
        obj[entry] -= args[0];
        return obj[entry];
    }
    operatorDivAssign(obj, entry, args) {
        obj[entry] /= args[0];
        return obj[entry];
    }
    operatorMulAssign(obj, entry, args) {
        obj[entry] *= args[0];
        return obj[entry];
    }
    operatorPlus(obj, entry, args) {
        return this.prevPlace + args[0];
    }
    operatorMinus(obj, entry, args) {
        return this.prevPlace - args[0];
    }
    operatorDiv(obj, entry, args) {
        return this.prevPlace / args[0];
    }
    operatorMul(obj, entry, args) {
        return this.prevPlace * args[0];
    }

    operatorNew(obj, entry, args) {
        return new (this.prevPlace)(...args);
    }
    operatorAsContext(obj, entry, args) {
        return args[0];
    }
    operatorThrough(obj, entry, args) {
        return this.prevPlace;
    }
    operatorThenElse(obj, entry, args) {
        if(this.prevPlace)
            return args[0];
        return args[1];
    }
    operatorElse(obj, entry, args) {
        if(!this.prevPlace)
            return args[0];
        return this.prevPlace;
    }
    operatorThen(obj, entry, args) {
        if(this.prevPlace)
            return args[0];
        return this.prevPlace;
    }
    operatorMap(obj, entry, args) {
        let fn = args[0];
        return this.prevPlace.map((item, i) => fn(item, i));
    }
    operatorReduce(obj, entry, args) {
        let fn = args[1];
        return this.prevPlace.reduce((acc, item, i) => fn(acc, item, i), args[0])
    }

    run(){
        for(let entry; entry = this.path[this.position] ; ){
            this.entryTypeMethods.get(entry.constructor)(entry);
        }
        return this.curPlace;
    }
}

