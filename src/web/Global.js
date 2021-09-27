const Interpreter = require('../Interpreter.js');
const Parser = require('../Parser.js');


let nativeScope =
    typeof(window) !== "undefined"
        ? window
        : typeof(global) !== "undefined"
            ? global
            : typeof(self) !== "undefined"
                ? self
                : globalThis;


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
        this.async = new JsyonAsync(this);

        this.True = true;
        this.False = false;
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
        return (...innerArgs) => {
            let context = this.Obj(...this.zip(params, innerArgs));
            return new Interpreter(this, body, context).run();
        };
    }
    
    Num(n) {
        return new Number(n);
    }
    
    Str(data) {
        return new String(data);
    }
};

module.exports = Global;
