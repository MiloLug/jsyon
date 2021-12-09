const operators = {
    "(new)": ({prevPlace}, obj, entry) => (...args) => new (prevPlace)(...args),
    
    "(as-context)": (state, obj, entry) => context => context,
    "(through)": ({prevPlace}, obj, entry) => () => prevPlace,
    
    "(then-else)": ({prevPlace}, obj, entry) => (valueThen, valueElse) => 
        prevPlace ? valueThen : valueElse,

    "(else)": ({prevPlace}, obj, entry) => value =>
        !prevPlace ? value : prevPlace,
    
    "(then)": ({prevPlace}, obj, entry) => value =>
        prevPlace ? value : prevPlace,
    
    "(map)": async ({prevPlace}, obj, entry) => fn => Promise.all(
        prevPlace.map((item, i) => fn(item, i))
    ),

    "(reduce)": async ({prevPlace}, obj, entry) => async (acc, fn) => {
        for(let i = 0, len = prevPlace.length; i < len; i++)
            acc = await fn(acc, prevPlace[i], i);
            
        return acc;
    },
   
    "(async)": async ({prevPlace}, obj, entry) => (...args) => {
        const ret = new Promise((res, rej) => res(prevPlace(...args)));
        return () => ret;
    },
   
    "(bind)": async ({prevPlace}, obj, entry) =>
        (...bindedArgs) => (...args) => prevPlace(...bindedArgs, ...args),

    "=": (state, obj, entry) => value => (obj[entry] = value, value),
    "+=": (state, obj, entry) => value => obj[entry] += value,
    "-=": (state, obj, entry) => value => obj[entry] -= value,
    "/=": (state, obj, entry) => value => obj[entry] /= value,
    "*=": (state, obj, entry) => value => obj[entry] *= value,
    
    "+": ({prevPlace}) => value => prevPlace + value,
    "-": ({prevPlace}) => value => prevPlace - value,
    "/": ({prevPlace}) => value => prevPlace / value,
    "%": ({prevPlace}) => value => prevPlace % value,
    "*": ({prevPlace}) => value => prevPlace * value,
    "**": ({prevPlace}) => value => prevPlace ** value,

    ">": ({prevPlace}) => value => prevPlace > value,
    "<": ({prevPlace}) => value => prevPlace < value,
    "==": ({prevPlace}) => value => prevPlace === value,
    "!=": ({prevPlace}) => value => prevPlace !== value,
    "&": ({prevPlace}) => value => prevPlace & value,
    "|": ({prevPlace}) => value => prevPlace | value,

    "..": ({prevPlace, global}, obj, entry) => (value, step=1) => global.Range(prevPlace, value, step),
};

module.exports = new Map(Object.entries(operators));
