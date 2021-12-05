const operators = require('./operators.js');

class Interpreter {
    static entryTypeMethods = new Map();
    static exprMap = new Map();
    static rawExprMap = new Map();

    constructor(path) {        
        this.position = 0;
        this.path = path;
        this.hasStartingPoint = false;
        // stores functions like (state) => {...}
        // where the state is an object with context, prev state etc.
        this.executionQueue = [];

        this.initialization = this.init();
    }

    /**
     * Runs any given expression using cache - expression given twice will not be baked again
     * @param {'BaseGlobal'} global Object with default functions
     * @param {Array} expr Expression
     * @param {*} context Expression's context
     * @returns whatewer the expr returns
     */
    static runExprGlobal(global, expr, context) {
        if(Interpreter.exprMap.has(expr))
            return Interpreter.exprMap.get(expr).run(global, context);
        else {
            const interp = new Interpreter(expr);
            Interpreter.exprMap.set(expr, interp);
            return interp.run(global, context);
        }
    }

    /**
     * Bakes given expression, translating it in a queue of function calls
     * @returns {Promise<void>} nothing
     */
    async init() {
        let fn;
        for(let entry; (entry = this.path[this.position]) !== undefined ; ) {
            if(fn = Interpreter.entryTypeMethods.get(entry.constructor))
                await fn.call(this, entry);
            else
                this.position++;
        }
    }
    
    setStartingPoint(entry) {
        switch(entry){
            case "~>":
                this.executionQueue.push(async (state)=>{
                    state.curPlace = state.context;
                });
                this.position++;
                break;
            case "global":
                this.executionQueue.push(async (state)=>{
                    state.curPlace = state.global;
                });
                this.position++;
                break;
            default:
                this.executionQueue.push(async (state)=>{
                    state.curPlace = state.global;
                });
        }
        this.hasStartingPoint = true;
    }

    async processStringEntry(entry) {
        if(entry?.constructor === String && !isNaN(parseInt(entry))) {
            this.path[this.position] = +entry;
            return;
        }
        if(this.position === 0 && !this.hasStartingPoint) {
            this.setStartingPoint(entry);
            return;
        }

        if(operators.has(entry)) {
            const prevEntry = this.path[this.position-1];

            this.executionQueue.push(async (state)=>{
                const place = state.prevPlace;
                state.prevPlace = state.curPlace;
                state.curPlace = await operators.get(entry)(state, place, prevEntry); 
            });

            this.position++;
            return;
        }

        this.executionQueue.push(async (state)=>{
            if(state.curPlace !== undefined) {
                state.prevPlace = state.curPlace;
                state.curPlace = state.curPlace?.__get_attr__
                    ? state.curPlace.__get_attr__(entry)
                    : state.curPlace?.[entry];
            }
        });
        this.position++;
    }

    async processNumberEntry(entry) {
        if(this.position === 0 && !this.hasStartingPoint) {
            this.executionQueue.push(async (state)=>{
                state.curPlace = {[entry]: entry};
            });
            this.hasStartingPoint = true;
        }
        
        this.processStringEntry(entry);
    }

    async processArrayEntry(entry) {
        this.executionQueue.push(async (state)=>{
            let args = [];
            for (let i = 0, len = entry.length; i < len; i++){
                const item = entry[i];
                if (item?.constructor === Object) {
                    if (item["@__unpack_arr_args"])
                        args.push(...(await this.processObject(state, item)));
                    else
                        args.push(await this.processObject(state, item));
                } else
                    args.push(item);
            }
            let tmp = state.curPlace;
            state.curPlace = await state.curPlace.apply(state.prevPlace, args);
            state.prevPlace = tmp;
        });
        this.position++;
    }

    async processObjectEntry(entry) {
        
        if(this.position === 0 && !this.hasStartingPoint){
            this.setStartingPoint();
            
            this.executionQueue.push(async (state)=>{
                state.prevPlace = state.curPlace;
                state.curPlace = await this.processObject(state, entry);
            });

            this.position++;
            return;
        }
        if(this.curPlace !== undefined) {
            this.executionQueue.push(async (state)=>{
                state.prevPlace = state.curPlace;
                state.curPlace = state.curPlace[
                    await this.processObject(state, entry)
                ];
            });
        }
        this.position++;
    }

    async processObject(state, obj) {
        let ctx = undefined;
        
        if(obj["@__raw"]) { 
            if(obj["@__last"] !== undefined) {
                let raw = Interpreter.rawExprMap.get(obj["@__last"]);
                if (raw)
                    return raw;
                Interpreter.rawExprMap.set(obj["@__last"], raw = ["~>", "(as-context)", [{"@__last": obj["@__last"]}]]);
                return raw;
            }
            return obj["@__expr"];
        }

        if(obj["@__follow_ctx"])
            ctx = state.context;

        if(obj["@__expr"] !== undefined){
            return Interpreter.runExprGlobal(state.global, obj["@__expr"], ctx || state.prevPlace);
        }

        if(obj["@__last"] !== undefined){
            const exprs = obj["@__last"];
            ctx ||= state.prevPlace;

            if(obj["@__async"]) {
                const toHandle = [];
                
                for(let i = 0, len = exprs.length; i < len; i++)
                    toHandle.push(Interpreter.runExprGlobal(state.global, exprs[i], ctx));

                await Promise.all(toHandle);
                return toHandle.length ? toHandle[toHandle.length - 1] : state.global.Null;
            }
            
            let ret;
            for(let i = 0, len = exprs.length; i < len; i++)
                ret = await Interpreter.runExprGlobal(state.global, exprs[i], ctx);
            return ret;
        }

        let keys = Object.getOwnPropertyNames(obj);
        for(let i = 0, len = keys.length; i < len; i++){
            const key = keys[i];
            const data = obj[key];
            if(data != undefined && data.constructor === Object)
                obj[key] = await this.processObject(state, data);
        }
        return obj;
    }
    
    /**
     * Runs baked expression (waits for the `init` to finish)
     * @param {'BaseGlobal'} global Object with default functions
     * @param {*} context Expression's context
     * @returns {*} Whatever the expr returns
     */
    async run(global, context){
        await this.initialization;

        const state = {
            global: global,
            context: context,
            prevPlace: undefined,
            curPlace: undefined
        }

        for(let i = 0, len = this.executionQueue.length; i < len; i++) {
            await this.executionQueue[i](state);
        }
        const ret = state.curPlace;

        return ret;
    }
};

Interpreter.entryTypeMethods.set(String, Interpreter.prototype.processStringEntry);
Interpreter.entryTypeMethods.set(Array, Interpreter.prototype.processArrayEntry);
Interpreter.entryTypeMethods.set(Object, Interpreter.prototype.processObjectEntry);
Interpreter.entryTypeMethods.set(Number, Interpreter.prototype.processNumberEntry);

module.exports = Interpreter;
