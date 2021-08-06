function escapeRegExp(string) {
    return string.replace(/[\/.*+?^${}()|[\]\\\-]/g, '\\$&');
}

class TokenCollection {
    constructor(tokenLength, tokens){
        this.tokens = tokens;
        this.tokenLength = tokenLength;
    }

    toString() {
        if(this.tokenLength === 1)
            return `[${escapeRegExp(this.tokens.join(''))}]`;

        return `(?:${this.tokens.map(escapeRegExp).join('|')})`;
    }
}
class QuoteBlock {
    constructor(quote){
        this.quote = quote;
    }
    
    toString() {
        return `(?:${this.quote})((?:\\\\${this.quote}|.|\\n)*?)(?:${this.quote})`;
    }
}


export class Parser {
    static tokenCollections = [
        new TokenCollection(2, ['+=', '-=', '/=', '*=']),
        new TokenCollection(1, ['=', '+', '-', '/', '*', ',', ':', '[', ']', '{', '}', '(', ')', '@']),
    ];
    static quoteBlocks = [
        new QuoteBlock('"'),
        new QuoteBlock("`"),
        new QuoteBlock("'")
    ];
    static blockOpenSymbols = {
        '{': '}',
        '[': ']',
        '(': ')'
    };
    static blockCloseSymbols = {
        '}': '{',
        ']': '{',
        ')': '('
    };
    static tokenizerRegExp = new RegExp(
        Parser.quoteBlocks.join('|')
        + `|(?:\\d|\\w|\\\\(?:${Parser.tokenCollections.join('|')}))+|`
        + Parser.tokenCollections.join('|'),
        'gmi'
    );

    constructor(code, tokens=null) {
        this.tokens = tokens || [...code.matchAll(Parser.tokenizerRegExp)].map(
            item => item
                .reverse()
                .find(group => group !== undefined)
        );
        this.position = 0;
        this.tokensCount = this.tokens.length;
        this.body = [];

        this.blockParsers = {
            '{': this.parseObjectBlock.bind(this),
            '[': this.parseArrayBlock.bind(this),
            '(': this.parseOperatorBlock.bind(this)
        };
    }

    current() {
        return this.tokens[this.position];
    }
    next() {
        this.position++;
        return this.current();
    }
    push(bodyPart) {
        this.body.push(bodyPart);
    }

    prepareString(data) {
        return data ? data.replace(/\\(.)/gmi, "$1") : "";
    }

    buildExpr(parameters, tokens) {
        parameters = parameters
            .filter(item => item)
            .reduce((acc, item) => (acc[item] = 1, acc), {});
        let obj = {};
        if (parameters["raw"]) obj["@__raw"] = 1;
        if (parameters["@"]) obj["@__follow_ctx"] = 1;
        if (parameters["last"]) {
            obj["@__last"] = this.getArrayTopLevelItems(tokens)
                .map(item => new Parser(null, item).parse());
        }
        else {
            obj["@__expr"] = new Parser(
                null,
                this.getArrayTopLevelItems(tokens)[0]
            ).parse();
        }

        return obj;
    }

    getArrayTopLevelItems(tokens) {
        let items = [],
            count = 0,
            pos = 0,
            s,
            len = tokens.length,
            item = [];
        while (pos < len) {
            s = tokens[pos];
            pos++;
            if(Parser.blockOpenSymbols[s]) count++;
            else if(Parser.blockCloseSymbols[s]) count--;
            else if(s === ',' && count === 0) {
                items.push(item);
                item = [];
                continue;
            }
            item.push(s);
            
            if (pos == len) items.push(item);
        }
        return items;
    }

    parseArrayBlock(tokens) {
        let items = this.getArrayTopLevelItems(tokens),
            parsedItems = [];
        for (let item of items) {
            let exprSignPos = item.indexOf(':');
            if(exprSignPos !== -1){
                parsedItems.push(this.buildExpr(
                    item.slice(0, exprSignPos),
                    item[exprSignPos+1] === '['
                        ? item.slice(exprSignPos + 2, item.length - 1)
                        : item.slice(exprSignPos + 1, item.length)
                ));
            }
            else
                parsedItems.push(
                    this.prepareString(item.join(""))
                );
        }
        return parsedItems;
    }

    parseObjectBlock(tokens) {
        return this.parseArrayBlock(tokens)[0];
    }

    parseOperatorBlock(tokens) {
        return `(${tokens.join('')})`;
    }

    parseBlock() {
        let count = 1,
            opening = this.current(),
            closing = Parser.blockOpenSymbols[opening],
            blockTokens = [],
            s;
        while (this.position < this.tokensCount) {
            s = this.next();
            if (s === opening) count++;
            else if (s === closing && (--count) === 0) {
                break;
            }
            blockTokens.push(s);
        }
        this.next();
        this.body.push(this.blockParsers[opening](blockTokens));
    }

    parse() {
        let s;
        while (this.position < this.tokensCount) {
            s = this.current();
            if (Parser.blockOpenSymbols[s]) {
                this.parseBlock();
                s = this.current();
            }
            else {
                this.push(this.prepareString(s));
                this.next();
            }
        }
        return this.body;
    }
}

let stdLib = {
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
            let context = stdLib.Obj(...stdLib.zip(params, innerArgs));
            return new Walker(body, context).run();
        };
    },
    Num(n) {
        return new Number(n);
    },
    Str(data) {
        return new String(data);
    }
};

export class Walker {
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
                this.curPlace = window;
                this.position++;
                break;
            case "std":
                this.curPlace = stdLib;
                this.position++;
                break;
            default:
                this.curPlace = window;
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
            return (new Walker(obj["@__expr"], ctx || this.prevPlace)).run();
        if(obj["@__last"] !== undefined){
            let ret;
            for(let expr of obj["@__last"])
                ret = (new Walker(expr, ctx || this.prevPlace)).run();
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


export function hornyRun(code, context=undefined){
    return new Walker(new Parser(code).parse(), context).run();
}

