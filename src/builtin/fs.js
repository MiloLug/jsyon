const fs = require('fs').promises;
const path = require('path');

class FS {
    constructor(global) {
        this.__global = global;
    }
    
    async read_file(path) {
        return await fs.readFile(path, "utf-8");
    }

    async read_dir(path) {
        return await fs.readdir(path);
    }

    async is_file(path) {
        return (await fs.stat(path)).isFile();
    }

    async resolve(...paths) {
        return path.resolve(...paths);
    }

    async basename(pathWay) {
        return path.basename(pathWay);
    }

    async dirname(pathWay) {
        return path.dirname(pathWay);
    }
}

module.exports = FS;
