const Interpreter = require('../../interpreter.js');

class DebuggingInterpreter extends Interpreter {
    static runExprGlobal(...args) {
        const oldCacheSize = Interpreter.exprCacheMap.size;
        const r = Interpreter.runExprGlobal(...args);

        if (Interpreter.exprCacheMap.size !== oldCacheSize)
            console.log("\x1b[33m--ExprCache--\x1b[0m", "size: ", Interpreter.exprCacheMap.size);

        return r;
    }

    async processObject(...args) {
        const oldCacheSize = Interpreter.rawExprCacheMap.size;
        const r = await super.processObject(...args);

        if (Interpreter.rawExprCacheMap.size !== oldCacheSize)
            console.log("\x1b[33m--RawExprCache--\x1b[0m", "size: ", Interpreter.rawExprCacheMap.size);

        return r;
    }
}

module.exports = DebuggingInterpreter;
