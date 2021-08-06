import Interpreter from './Interpreter.js';
import Parser from './Parser.js';
import Global from './Global.js';

export {Interpreter, Parser, Global};

export function hornyRun(code, context=undefined){
    return new Interpreter(new Parser(code).parse(), context).run();
}
