const Global = require('../global.js');
const Interpreter = require('./interpreter.js');
const Parser = require('../../parser.js');


class DebuggingGlobal extends Global {
    async eval(code, context) {
        return new Interpreter(new Parser(code).parse()).run(this, context);
    }

    async eval_json(json, context) {
        return new Interpreter(json).run(this, context);
    }

    Fn(...args) {
        let body = args[args.length - 1];
        let params = args.slice(0, args.length - 1);

        let fn = (...innerArgs) => {
            let context = this.Obj(...this.zip(params, innerArgs));
            context['__fn__'] = fn;
            context['__args__'] = innerArgs;
            context['__args_names__'] = params;
            return Interpreter.runExprGlobal(this, body, context);
        };
        return fn;
    }
}

module.exports = DebuggingGlobal;