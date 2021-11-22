class JsyonAsync {
    constructor(global) {
        this.__global = global;
    }

    async wait_all(...fns) {
        return Promise.all(fns.map(fn => fn()));
    }
}

module.exports = JsyonAsync;
