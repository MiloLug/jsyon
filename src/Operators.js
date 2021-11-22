module.exports = {
    "(new)": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return (...args) => new (prevPlace)(...args);
    },
    
    "(as-context)": (ctx, obj, entry) => context => context,
    
    "(through)": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return () => prevPlace;
    },
    
    "(then-else)": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return (valueThen, valueElse) => {
            if(prevPlace)
                return valueThen;
            return valueElse;
        };
    },
    
    "(else)": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => {
            if(!prevPlace)
                return value;
            return prevPlace;
        };
    },
    
    "(then)": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => {
            if(prevPlace)
                return value;
            return prevPlace;
        };
    },
    
    "(map)": async (ctx, obj, entry) => {
        let prevPlace = crx.prevPlace;

        return fn => Promise.all(prevPlace.map((item, i) => fn(item, i)));
    },
   
    "(async)": async (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return (...args) => {
            let ret = new Promise((res, rej) => res(prevPlace(...args)));
            return () => ret
        };
    },

    "(reduce)": async (ctx, obj, entry) => {
        let i = 0;
        let prevPlace = ctx.prevPlace;
        
        return async (acc, fn) => {
            for(let item of prevPlace) {
                await fn(acc, item, i);
                i++;
            }
            return acc;
        };
    },

    "=": (ctx, obj, entry) => value => (obj[entry] = value, value),
    "+=": (ctx, obj, entry) => value => obj[entry] += value,
    "-=": (ctx, obj, entry) => value => obj[entry] -= value,
    "/=": (ctx, obj, entry) => value => obj[entry] /= value,
    "*=": (ctx, obj, entry) => value => obj[entry] *= value,
    
    "+": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace + value;
    },
    "-": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace - value;
    },
    "/": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace / value;
    },
    "*": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace * value;
    },

    ">": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace > value;
    },
    "<": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace < value;
    },
    "==": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace === value;
    },
    "!=": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace !== value;
    },

    "...": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        let global = ctx.global;
        return (value, step=1) => global.Range(prevPlace, value, step);
    }
};
