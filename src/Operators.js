let Operators;
export default Operators = {
    "(new)": (ctx, obj, entry, args) => new (ctx.prevPlace)(...args),
    
    "(as-context)": (ctx, obj, entry, args) => args[0],
    
    "(through)": (ctx, obj, entry, args) => ctx.prevPlace,
    
    "(then-else)": (ctx, obj, entry, args) => {
        if(ctx.prevPlace)
            return args[0];
        return args[1];
    },
    
    "(else)": (ctx, obj, entry, args) => {
        if(!ctx.prevPlace)
            return args[0];
        return ctx.prevPlace;
    },
    
    "(then)": (ctx, obj, entry, args) => {
        if(ctx.prevPlace)
            return args[0];
        return ctx.prevPlace;
    },
    
    "(map)": (ctx, obj, entry, args) => {
        let fn = args[0];
        return ctx.prevPlace.map((item, i) => fn(item, i));
    },
    
    "(reduce)": (ctx, obj, entry, args) => {
        let fn = args[1];
        return ctx.prevPlace.reduce((acc, item, i) => fn(acc, item, i), args[0])
    },

    "=": (ctx, obj, entry, args) => {
        obj[entry] = args[0];
        return args[0];
    },
    "+=": (ctx, obj, entry, args) => obj[entry] += args[0],
    "-=": (ctx, obj, entry, args) => obj[entry] -= args[0],
    "/=": (ctx, obj, entry, args) => obj[entry] /= args[0],
    "*=": (ctx, obj, entry, args) => obj[entry] *= args[0],
    
    "+": (ctx, obj, entry, args) => ctx.prevPlace + args[0],
    "-": (ctx, obj, entry, args) => ctx.prevPlace - args[0],
    "/": (ctx, obj, entry, args) => ctx.prevPlace / args[0],
    "*": (ctx, obj, entry, args) => ctx.prevPlace * args[0]
};
