const operators = {
    "(new)": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return (...args) => new (prevPlace)(...args);
    },
    
    "(as-context)": (state, obj, entry) => context => context,
    
    "(through)": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return () => prevPlace;
    },
    
    "(then-else)": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return (valueThen, valueElse) => {
            if(prevPlace)
                return valueThen;
            return valueElse;
        };
    },
    
    "(else)": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => {
            if(!prevPlace)
                return value;
            return prevPlace;
        };
    },
    
    "(then)": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => {
            if(prevPlace)
                return value;
            return prevPlace;
        };
    },
    
    "(map)": async (state, obj, entry) => {
        let prevPlace = state.prevPlace;

        return fn => Promise.all(prevPlace.map((item, i) => fn(item, i)));
    },

    "(reduce)": async (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        
        return async (acc, fn) => {
            for(let i = 0, len = prevPlace.length; i < len; i++)
                acc = await fn(acc, prevPlace[i], i);
                
            return acc;
        };
    },
   
    "(async)": async (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return (...args) => {
            let ret = new Promise((res, rej) => res(prevPlace(...args)));
            return () => ret;
        };
    },
   
    "(bind)": async (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return (...bindedArgs) => (...args) => prevPlace(...bindedArgs, ...args);
    },

    "=": (state, obj, entry) => value => (obj[entry] = value, value),
    "+=": (state, obj, entry) => value => obj[entry] += value,
    "-=": (state, obj, entry) => value => obj[entry] -= value,
    "/=": (state, obj, entry) => value => obj[entry] /= value,
    "*=": (state, obj, entry) => value => obj[entry] *= value,
    
    "+": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace + value;
    },
    "-": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace - value;
    },
    "/": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace / value;
    },
    "*": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace * value;
    },

    ">": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace > value;
    },
    "<": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace < value;
    },
    "==": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace === value;
    },
    "!=": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace !== value;
    },
    "&": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace & value;
    },
    "|": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        return value => prevPlace | value;
    },

    "..": (state, obj, entry) => {
        let prevPlace = state.prevPlace;
        let global = state.global;
        return (value, step=1) => global.Range(prevPlace, value, step);
    }
};

module.exports = new Map(Object.entries(operators));
