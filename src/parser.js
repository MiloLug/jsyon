const SparkMD5 = require('spark-md5');


function escapeRegExp(string) {
    return string.replace(/[\/.*+?^${}()|[\]\\\-]/g, '\\$&');
}

class TokenCollection {
    // Creates regex template part that matches tokens of particular length
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

class SpecialChars {
    // Creates reegex templates to match given special
    // chars and replace them with the "originals"
    static colorizationRegExp = new RegExp(`(?<!\\\\)(?:\\\\)(?:x1b\\[(\\d+)m)`, 'gmi');

    constructor(...chars) {
        this.chars = chars.map(ch => '\\\\' + ch[0]);
        this.specials = chars.reduce((acc, ch) => (acc[ch[0]] = ch[1], acc), {});

        this.findTemplate = `(?:${chars.map(ch => '\\\\'+escapeRegExp(ch[0])).join('|')})`;
        this.replaceRegExp = new RegExp(`(?<!\\\\)(?:\\\\)(${chars.map(ch => escapeRegExp(ch[0])).join('|')})`, 'gmi');
    }

    clean(str) {
        // replaces all special chars with their originals
        return str
            .replace(this.replaceRegExp, (full, $1) => this.specials[$1])
            .replace(SpecialChars.colorizationRegExp, (full, $1) => `\x1b[${$1}m`);
    }

    toString() {
        return this.findTemplate;
    }
}

class QuoteBlock {
    // Matches a block enclosed with given quotes

    static specialsChars = new SpecialChars(['n', '\n'], ['r', '\r'], ['t', '\t']);

    constructor(quote){
        this.quote = quote;
    }
    
    toString() {
        return `(?:${this.quote})((?:\\\\${this.quote}|${QuoteBlock.specialsChars}|.|\\n)*?)(?:${this.quote})`;
    }
}


class Parser {
    static tokenCollections = [
        new TokenCollection(2, ['+=', '-=', '/=', '*=', '~>', '==', '!=', '..', '**']),
        new TokenCollection(1, ['$', '>', '<', '!', '~', '&', '|', '=', '+', '-', '/', '*', ',', ':', '[', ']', '{', '}', '(', ')', '@', '.', '%']),
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

    // put together all the parts of big regex
    static tokenizerRegExp = new RegExp(
        Parser.quoteBlocks.join('|')
        + `|(?<comment>#\\*[\\s\\S]*?\\*#|#.*?$)`  // comments
        + `|(?:-|)(?:0x[a-f0-9]+|0o[0-7]+|0b[01]+|\\d+)(?!\\w)`  // numbers
        + `|(?:\\d|\\w|\\\\(?:${Parser.tokenCollections.join('|')}))+|`  // plain words (if connected to the tokens etc)
        + Parser.tokenCollections.join('|'),
        'gmi'
    );

    constructor(code, tokens=null) {
        this.tokens = tokens || [...code.matchAll(Parser.tokenizerRegExp)]
            .filter(item => !item.groups?.comment)
            .map(
                item => QuoteBlock.specialsChars.clean(
                    item
                    .reverse()
                    .find(group => group !== undefined)  // it's convenient to take something important from the last group
                )
            );
        this.position = 0;
        this.tokensCount = this.tokens.length;
        this.body = [];

        this.blockParsers = {  // create block-types handlers to quickly access them
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
        // replace all escaped chars with their originals
        return data ? data.replace(/\\(.)/gmi, "$1") : "";
    }

    createArrayHash(arr) {        
        const spark = new SparkMD5();

        let tmp;
        for(let i = 0, len = arr.length; i < len; i++) {
            tmp = arr[i];
            switch(tmp?.constructor) {
                case Object:
                    tmp = this.createObjectHash(tmp);
                    break;
                case Array:
                    tmp = this.createArrayHash(tmp);
                    break;
                default:
                    tmp = "" + tmp;
            }
            spark.append(tmp);
        }

        return spark.end();
    }

    createObjectHash(obj) {
        const existingHash = obj?.["@__hash"];
        if(existingHash)
            return SparkMD5.hash("Object " + existingHash)
        
        const spark = new SparkMD5();
        const keys = Object.getOwnPropertyNames(obj).sort();

        let tmp;
        for(let i = 0, len = keys.length; i < len; i++) {
            tmp = obj[key];
            switch(tmp?.constructor) {
                case Object:
                    tmp = this.createObjectHash(tmp);
                    break;
                case Array:
                    tmp = this.createArrayHash(tmp);
                    break;
                default:
                    tmp = "" + tmp;
            }
            spark.append(tmp);
        }

        return spark.end();
    }

    createHash(expr) {
        switch(expr?.constructor) {
            case Object:
                return this.createObjectHash(expr);
            case Array:
                return this.createArrayHash(expr);
            default:
                return SparkMD5.hash("" + expr);
        }
    }

    buildExpr(parameters, tokens) {
        parameters = parameters
            .filter(item => item)
            .reduce((acc, item) => (acc[item] = 1, acc), {});
        let obj = {};
        if (parameters["$"]) obj["@__raw"] = 1;
        if (parameters["@"]) obj["@__follow_ctx"] = 1;
        if (parameters["async"]) obj["@__async"] = 1;
        if (parameters[".."]) obj["@__unpack_arr_args"] = 1;

        if (parameters[">"]) {
            obj["@__last"] = this.getArrayTopLevelItems(tokens)
                .map(item => new Parser(null, item).parse());
            obj["@__items_hashes"] = obj["@__last"].map(item => this.createHash(item));
            obj["@__hash"] = SparkMD5.hash(obj["@__items_hashes"].join(''));
        }
        else {
            obj["@__expr"] = new Parser(
                null,
                this.getArrayTopLevelItems(tokens)[0]
            ).parse();
            obj["@__hash"] = this.createHash(obj["@__expr"]);
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


module.exports = Parser;
