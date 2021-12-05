class Branches {
    constructor(global) {
        this.__global = global;
    }

    async multi_test_selector(...variants) {
        return async (...testArgs) => {
            const accepted = [];
            const promise = Promise.all(variants.map(
                async variant => {
                    if(await variant[0](...testArgs))
                        accepted.push(variant[1]);
                }
            ));
            return async (...args) => {
                await promise;
                const ret = [];

                for(const fn of accepted) {
                    ret.push(await fn(...args));
                }
                return ret;
            };
        };
    }

    async test_selector(...variants) {
        return async (...testArgs) => {
            const accepted = (async () => {
                for(const variant of variants) {
                    if(await variant[0](...testArgs))
                        return variant[1];
                }
            })();
            return async (...args) => (await accepted)?.(...args);
        }
    }

    async multi_match_selector(...variants) {
        return async testValue => {
            const accepted = [];
            const promise = Promise.all(variants.map(
                async variant => {
                    if(variant[0] === testValue)
                        accepted.push(variant[1]);
                }
            ));
            return async (...args) => {
                await promise;
                const ret = [];

                for(const fn of accepted) {
                    ret.push(await fn(...args));
                }
                return ret;
            };
        };
    }

    async match_selector(...variants) {
        return async testValue => {
            const accepted = (async () => {
                for(const variant of variants) {
                    if(variant[0] === testValue)
                        return variant[1];
                }
            })();
            return async (...args) => (await accepted)?.(...args);
        }
    }

    async test(condition, fn) {
        return async (...testArgs) => {
            const accepted = (async () => {
                if(await condition(...testArgs))
                    return fn;
                return () => this.__global.Null;
            })();

            return async (...args) => (await accepted)(...args);
        }
    }

    async match(condition, fn) {
        return async testValue => {
            let accepted = () => this.__global.Null;
            if(condition === testValue)
                accepted = fn;
                        
            return accepted;
        }
    }
}

module.exports = Branches;
