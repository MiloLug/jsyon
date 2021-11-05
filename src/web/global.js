const BaseGlobal = require('../base_global.js');
const builtIn = require('./builtin.js');


class Global extends BaseGlobal {
    constructor() {
        super();
    }

    async import(moduleName, useCache=true, context) {
        // Will be resolved later. So i can put this Promise to the cache to share it.
        let resolve, reject;
        let ret = new Promise((res, rej) => (resolve = res, reject = rej));

        if(useCache) {
            // so everyone trying to use import will get the same instance
            if(this.__import_cache.has(moduleName)) {
                resolve(this.__import_cache.get(moduleName));
                return ret;
            }
            else this.__import_cache.set(moduleName, ret);
        }

        resolve(
            new (builtIn.get(relPath))(this)
        );
        return ret;
    }

    print(...args) {
        console.log(...args);
        return args;
    }
   
    input(msg="") {
        return prompt(msg);
    }
};

module.exports = Global;
