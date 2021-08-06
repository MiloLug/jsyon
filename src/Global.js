import Interpreter from './Interpreter.js';

let nativeScope =
    typeof(window) !== "undefined"
        ? window
        : typeof(global) !== "undefined"
            ? global
            : typeof(self) !== "undefined"
                ? self
                : globalThis;


let Global;
export default Global = {
    js: nativeScope,

    zip(...args) {
        return args[0].map(
            (_, i) => args.map(arg => arg[i])
        );
    },
    
    print(...args) {
        console.log(...args);
        return args;
    },
    
    Obj(...args) {
        return args.reduce(
            (acc, item) => (acc[item[0]] = item[1], acc),
            {}
        );
    },
    
    Arr(...args) {
        return (args);
    },
    
    Fn(...args) {
        let body = args[args.length - 1];
        let params = args.slice(0, args.length - 1);
        return (...innerArgs) => {
            let context = Global.Obj(...Global.zip(params, innerArgs));
            return new Interpreter(body, context).run();
        };
    },
    
    Num(n) {
        return new Number(n);
    },
    
    Str(data) {
        return new String(data);
    }
};

