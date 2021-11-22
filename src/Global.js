const Interpreter = require('./Interpreter.js');
const Parser = require('./Parser.js');
const path = require('path');
const fs = require('fs').promises;
const prompt = require('prompt-sync')({sigint: true});

const builtIns = require('./modules/index.js');

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


class Global {
    constructor(rootFilePath) {
        this.__root_file_path = rootFilePath;
        this.__root_dir_path = path.dirname(rootFilePath);
        this.Js = nativeScope;
        this.True = true;
        this.False = false;
        this.Null = null;

        this.__import_cache = new Map();
    }

    async import(relPath, useCache=true, context) {
        const isBuiltIn = builtIns.has(relPath);
        const fileName = path.basename(relPath);
        const fullPath = path.resolve(this.__root_dir_path, relPath);
        const nameArr = fileName.split('.');
        // Will be resolved later. So i can put this Promise to the cache to share it.
        let resolve, reject;
        let ret = new Promise((res, rej) => (resolve = res, reject = rej));

        if(useCache) {
            const cacheKey = isBuiltIn ? relPath : fullPath;
            
            // so everyone trying to use import will get the same instance
            if(this.__import_cache.has(cacheKey)) {
                relove(this.__import_cache.get(cacheKey));
                return ret;
            }
            else this.__import_cache.set(cacheKey, ret);
        }

        if(isBuiltIn) {
            resolve(
                new (builtIns.get(relPath)())(this)
            );
            return ret;
        }

        let src = fs.readFile(fullPath, "utf-8");
        const ext = nameArr.length > 1 ? nameArr[nameArr.length - 1] : "jy";

        switch(ext) {
            case "jyson":
                resolve(this.eval_json(JSON.parse(await src), context));
                break;
            case "json":
                resolve(JSON.parse(await src));
                break;
            case "jy":
            default:
                resolve(this.eval(await src, context));
                break;
        }

        return ret;
    }

    async eval(code, context) {
        return new Interpreter(this, new Parser(code).parse(), context).run();
    }

    async eval_json(json, context) {
        return new Interpreter(this, json, context).run();
    }
    
    zip(...args) {
        return args[0].map(
            (_, i) => args.map(arg => arg[i])
        );
    }

    Obj(...args) {
        return args.reduce(
            (acc, item) => (acc[item[0]] = item[1], acc),
            {}
        );
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
            return new Interpreter(this, body, context).run();
        };
        return fn;
    }
    
    Num(n) {
        return new Number(n);
    }
    
    Str(data) {
        return data?.__to_str__ ? data.__to_str__() : new String(data);
        return new String(data);
    }

    Range(a, b, step=1) {
        return new Range(global, a, b, step);
    }
    
    print(...args) {
        console.log(...args.map(arg => arg + ""));
        return args;
    }
   
    input(msg="") {
        return prompt(msg);
    }

    exit(code=0) {
        process.exit(code);
    }

};

module.exports = Global;
