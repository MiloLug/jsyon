from .utils import jsyon_getattr, jsyon_setattr

class Operators: 
    @staticmethod
    def assign(ctx, obj, entry, args):
        jsyon_setattr(obj, entry, args[0])
        return args[0]
    
    @staticmethod
    def plus_assign(ctx, obj, entry, args):
        jsyon_setattr(obj, entry, jsyon_getattr(obj, entry) + args[0])
        return obj[entry]
    
    @staticmethod
    def minus_assign(ctx, obj, entry, args):
        jsyon_setattr(obj, entry, jsyon_getattr(obj, entry) - args[0])
        return obj[entry]

    @staticmethod
    def div_assign(ctx, obj, entry, args):
        jsyon_setattr(obj, entry, jsyon_getattr(obj, entry) / args[0])
        return obj[entry]

    @staticmethod
    def mul_assign(ctx, obj, entry, args):
        jsyon_setattr(obj, entry, jsyon_getattr(obj, entry) * args[0])
        return obj[entry]

    @staticmethod
    def plus(ctx, obj, entry, args):
        return ctx.prev_point + args[0]

    @staticmethod
    def minus(ctx, obj, entry, args):
        return ctx.prev_point - args[0]
    
    @staticmethod
    def div(ctx, obj, entry, args):
        return ctx.prev_point / args[0]
    
    @staticmethod
    def mul(ctx, obj, entry, args):
        return ctx.prev_point * args[0]

    @staticmethod
    def new(ctx, obj, entry, args):
        return (ctx.prev_point)(*args)

    @staticmethod
    def as_context(ctx, obj, entry, args):
        return args[0]

    @staticmethod
    def through(ctx, obj, entry, args):
        return ctx.prev_point

    @staticmethod
    def then_else(ctx, obj, entry, args):
        if ctx.prev_point:
            return args[0]
        return args[1]

    @staticmethod
    def _else(ctx, obj, entry, args):
        if not ctx.prev_point:
            return args[0]
        return ctx.prev_point

    @staticmethod
    def then(ctx, obj, entry, args):
        if ctx.prev_point:
            return args[0]
        return ctx.prev_point
    
    @staticmethod
    def map(ctx, obj, entry, args):
        fn = args[0]
        return [fn(item, i) for i, item in enumerate(ctx.prev_point)]

    @staticmethod
    def reduce(ctx, obj, entry, args):
        fn = args[1]
        acc = args[0]
        for i, item in enumerate(ctx.prev_point):
            acc = fn(acc, item, i)
        return acc


shorthands = {
    "(new)": Operators.new,
    "(as-context)": Operators.as_context,
    "(through)": Operators.through,
    "(then-else)": Operators.then_else,
    "(else)": Operators._else,
    "(then)": Operators.then,
    "(map)": Operators.map,
    "(reduce)": Operators.reduce,

    "=": Operators.assign,
    "+=": Operators.plus_assign,
    "-=": Operators.minus_assign,
    "/=": Operators.div_assign,
    "*=": Operators.mul_assign,
    "+": Operators.plus,
    "-": Operators.minus,
    "/": Operators.div,
    "*": Operators.mul
}

