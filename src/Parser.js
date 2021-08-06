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


export default class Parser {
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

