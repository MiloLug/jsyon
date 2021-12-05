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
        let prevPlace = ctx.prevPlace;

        return fn => Promise.all(prevPlace.map((item, i) => fn(item, i)));
    },

    "(reduce)": async (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        
        return async (acc, fn) => {
            for(let i = 0, len = prevPlace.length; i < len; i++)
                acc = await fn(acc, prevPlace[i], i);
                
            return acc;
        };
    },
   
    "(async)": async (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return (...args) => {
            let ret = new Promise((res, rej) => res(prevPlace(...args)));
            return () => ret;
        };
    },
   
    "(bind)": async (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return (...bindedArgs) => (...args) => prevPlace(...bindedArgs, ...args);
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
    "&": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace & value;
    },
    "|": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        return value => prevPlace | value;
    },

    "..": (ctx, obj, entry) => {
        let prevPlace = ctx.prevPlace;
        let global = ctx.global;
        return (value, step=1) => global.Range(prevPlace, value, step);
    }
};
