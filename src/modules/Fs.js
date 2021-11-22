class JsyonFS {
    constructor(global) {
        this.__global = global;
    }
    
    async read_file(path) {
        return await fs.readFile(path, "utf-8");
    }
}

module.exports = JsyonFS;
