import Global from './Global.js';

export default class Interpreter {
    constructor(path, context, startFrom) {
        this.entryTypeMethods = new Map();
        this.entryTypeMethods.set(String, this.processStringEntry.bind(this));
        this.entryTypeMethods.set(Array, this.processArrayEntry.bind(this));
        this.entryTypeMethods.set(Object, this.processObjectEntry.bind(this));
        this.entryTypeMethods.set(Number, this.processStringEntry.bind(this));

        this.operators = {
            "(new)": this.operatorNew.bind(this),
            "(as-context)": this.operatorAsContext.bind(this),
            "(through)": this.operatorThrough.bind(this),
            "(then-else)": this.operatorThenElse.bind(this),
            "(else)": this.operatorElse.bind(this),
            "(then)": this.operatorThen.bind(this),
            "(map)": this.operatorMap.bind(this),
            "(reduce)": this.operatorReduce.bind(this),

            "=": this.operatorAssign.bind(this),
            "+=": this.operatorPlusAssign.bind(this),
            "-=": this.operatorMinusAssign.bind(this),
            "/=": this.operatorDivAssign.bind(this),
            "*=": this.operatorMulAssign.bind(this),
            "+": this.operatorPlus.bind(this),
            "-": this.operatorMinus.bind(this),
            "/": this.operatorDiv.bind(this),
            "*": this.operatorMul.bind(this)
        };
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

        if(this.operators[entry]) {
            let place = this.prevPlace;
            let prevEntry = this.path[this.position-1];
            this.prevPlace = this.curPlace;
            this.curPlace = (...args) => this.operators[entry](
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

