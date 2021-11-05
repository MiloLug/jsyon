const BaseGlobal = require('../base_global.js');
const path = require('path');
const fs = require('fs').promises;
const prompt = require('prompt-sync')({sigint: true});

const builtIn = require('./builtin.js');


class Global extends BaseGlobal {
    constructor(rootFilePath) {
        super();

        this.__root_file_path = rootFilePath;
        this.__root_dir_path = path.dirname(rootFilePath);
    }

    async import(relPath, useCache=true, context) {
        const isBuiltIn = builtIn.has(relPath);
        const fileName = path.basename(relPath);
        const fullPath = path.resolve(this.__root_dir_path, relPath);
        const nameArr = fileName.split('.');
        // Will be resolved later. So i can put this Promise to the cache to share it.
        let resolve, reject;
        let ret = new Promise((res, rej) => (resolve = res, reject = rej));

        if(useCache) {
            const cacheKey = isBuiltIn ? relPath : fullPath;
            
            // so everyone trying to use import will get the same instance
            if(this.__import_cache.has(cacheKey)) {
                resolve(this.__import_cache.get(cacheKey));
                return ret;
            }
            else this.__import_cache.set(cacheKey, ret);
        }

        if(isBuiltIn) {
            resolve(
                new (builtIn.get(relPath)())(this)
            );
            return ret;
        }

        let src = fs.readFile(fullPath, "utf-8");
        const ext = nameArr.length > 1 ? nameArr[nameArr.length - 1] : "jy";

        switch(ext) {
            case "jyson":
                resolve(this.eval_json(JSON.parse(await src), context));
                break;
            case "json":
                resolve(JSON.parse(await src));
                break;
            case "jy":
            default:
                resolve(this.eval(await src, context));
                break;
        }

        return ret;
    }

    print(...args) {
        console.log(...args.map(arg => arg + ""));
        return args;
    }
   
    input(msg="") {
        return prompt(msg);
    }

    exit(code=0) {
        process.exit(code);
    }

};

module.exports = Global;
