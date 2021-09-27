const Interpreter = require('./Interpreter.js');
const Parser = require('./Parser.js');
const path = require('path');
const fs = require('fs').promises;
const prompt = require('prompt-sync')({sigint: true});


let nativeScope =
    typeof(window) !== "undefined"
        ? window
        : typeof(global) !== "undefined"
            ? global
            : typeof(self) !== "undefined"
                ? self
                : globalThis;


class JsyonFS {
    constructor(global) {
        this.__global = global;
    }
    
    async read_file(path) {
        return await fs.readFile(path, "utf-8");
    }
}


class JsyonAsync {
    constructor(global) {
        this.__global = global;
    }

    async wait_all(...fns) {
        return Promise.all(fns.map(fn => fn()));
    }
}


class Global {
    constructor(rootFilePath) {
        this.__root_file_path = rootFilePath;
        this.__root_dir_path = path.dirname(rootFilePath);
        this.Js = nativeScope;
        this.fs = new JsyonFS(this);
        this.async = new JsyonAsync(this);

        this.True = true;
        this.False = false;

        this.__import_cache = {};
    }

    async import(relPath, useCache=true, context) {
        const fileName = path.basename(relPath);
        const fullPath = path.resolve(this.__root_dir_path, relPath);
        const nameArr = fileName.split('.');
        let src = this.fs.read_file(fullPath);
        let resolve, reject;
        let ret = new Promise((res, rej) => (resolve = res, reject = rej));

        if(useCache)
            if(fullPath in this.__import_cache)
                return this.__import_cache;
            else
                this.__import_cache = ret;
                

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

        return await ret;
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
    
    print(...args) {
        console.log(...args);
        return args;
    }
   
    input(msg="") {
        return prompt(msg);
    }

    Obj(...args) {
        return args.reduce(
            (acc, item) => (acc[item[0]] = item[1], acc),
            {}
        );
    }
    
    Arr(...args) {
        return (args);
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
        return new String(data);
    }
};

module.exports = Global;
