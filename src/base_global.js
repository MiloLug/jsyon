const Interpreter = require('./interpreter.js');
const Parser = require('./parser.js');

let nativeScope =
    typeof(window) !== "undefined"
        ? window
        : typeof(global) !== "undefined"
            ? global
            : typeof(self) !== "undefined"
                ? self
                : globalThis;


class Range {
    constructor(global, a, b, step=1) {
        this.__global = global;
        this.a = a;
        this.b = b;
        this.step = step;
        this.length = ((b - a) / step)|0;
        this.current = a - step;
    }

    next() {
        return (this.current += this.step);
    }

    __to_arr__() {
        let arr = [];
        let a = this.a;

        for(; a < this.b; a += this.step)
            arr.push(a);

        return arr;
    }

    __to_str__() {
        return `${this.a}...${this.b}|${this.step}`;
    }

    __get_attr__(entry) {
        if(entry?.constructor === Number)
            return this.a + this.step * entry;
        return this[entry];
    }
}


class BaseGlobal {
    constructor() {
        this.Js = nativeScope;
        this.True = true;
        this.False = false;
        this.Null = null;

        this.__import_cache = new Map();

        this.__native_typemap = new Map();
        this.__native_typemap.set(Object, this.Obj);
        this.__native_typemap.set(Array, this.Arr);
        this.__native_typemap.set(String, this.Str);
        this.__native_typemap.set(Number, this.Num);
        this.__native_typemap.set(Function, this.Fn);
        this.__native_typemap.set(Range, this.Range);
    }

    async import(relPath, useCache=true, context) {
        return null;
    }

    async eval(code, context) {
        return new Interpreter(this, new Parser(code).parse(), context).run();
    }

    async eval_json(json, context) {
        return new Interpreter(this, json, context).run();
    }
    
    zip(...args) {
        const res = [];
        const argsLen = args.length;

        if (!argsLen) return res;

        const resLen = args[0].length;
        let arg = args[0];

        for (let i = 0; i < resLen; i++)
            res.push([arg[i]]);

        for (let i = 1; i < argsLen; i++) {
            arg = args[i];

            for (let j = 0; j < resLen; j++)
                res[j].push(arg[j]);
        }

        return res;
    }

    Obj(...args) {
        const obj = {};
        for(let i = 0, len = args.length; i < len; i++)
            obj[args[i][0]] = args[i][1];

        return obj;
    }
    
    Arr(...args) {
        if(args.length === 1) {
            let a = args[0];
            if(a?.__to_arr__) return a.__to_arr__();
        }
        return args;
    }
    
    Fn(...args) {
        let body = args[args.length - 1];
        let params = args.slice(0, args.length - 1);
        let fn = (...innerArgs) => {
            let context = this.Obj(...this.zip(params, innerArgs));
            context['__fn__'] = fn;
            context['__args__'] = innerArgs;
            context['__args_names__'] = params;
            return new Interpreter(this, body, context).run();
        };
        return fn;
    }
    
    Num(n) {
        return +n;
    }
    
    Str(data) {
        return data?.__to_str__ ? data.__to_str__() : (data + "");
    }

    Range(a, b, step=1) {
        return new Range(global, a, b, step);
    }

    typeof(value) {
        if(value === undefined || value === this.Null)
            return this.Null;

        const constructor = Object.getPrototypeOf(value).constructor;

        if(this.__native_typemap.has(constructor))
            return this.__native_typemap.get(constructor);

        return this.Obj;
    }
    
    print(...args) {
        return null;
    }
   
    input(msg="") {
        return null;
    }

    sleep(time=1000, ctx=undefined) {
        return new Promise((res, rej) => setTimeout(
            ()=>res(ctx === undefined ? this : ctx),
            time
        ));
    }

    exit(code=0) {
        return null;
    }
};

module.exports = BaseGlobal;
