from collections.abc import Sequence, Mapping

class StdLib:
    zip = zip

    @staticmethod
    def print(*args):
        print(*args)
        return args

    Obj = lambda *args: dict(args)
    
    class Arr(list):
        def __init__(self, *args):
            super(StdLib.Arr, self).__init__(args)

        def push(self, item):
            self.append(item)
            return self

        def pop():
            return self.pop()

    @staticmethod
    def Fn(*args):
        body = args[-1];
        params = args[0:-1];
        return lambda *innerArgs: Walker(
            body,
            dict(zip(params, innerArgs))
        ).run()

    Num = float
    Str = str

    @staticmethod
    def getattr(obj, attrName):
        if isinstance(obj, Sequence):
            try:
                return obj[int(attrName)]
            except (IndexError, ValueError) as e:
                pass

        if isinstance(obj, Mapping):
            try:
                return obj[attrName]
            except (KeyError, TypeError) as e:
                pass
        
        try:
            return getattr(obj, str(attrName), None)
        except TypeError as e:
            return None

    @staticmethod
    def setattr(obj, attrName, attrValue):
        if isinstance(obj, Sequence):
            try:
                obj[int(attrName)] = attrValue
                return attrValue
            except (IndexError, ValueError) as e:
                pass

        if isinstance(obj, Mapping):
            try:
                obj[attrName] = attrValue
                return attrValue
            except (KeyError, TypeError) as e:
                pass
        
        try:
            setattr(obj, attrName, attrValue)
            return attrValue
        except (TypeError, AttributeError) as e:
            return attrValue

GLOBAL = {key: getattr(__builtins__, key) for key in dir(__builtins__)}

class Walker:
    def __init__(self, path, context=None):
        self.entryTypeMethods = {
            str: self.processStringEntry,
            list: self.processArrayEntry,
            dict: self.processObjectEntry,
            int: self.processStringEntry,
        }
        self.operators = {
            "(new)": self.operatorNew,
            "(as-context)": self.operatorAsContext,
            "(through)": self.operatorThrough,
            "(then-else)": self.operatorThenElse,
            "(else)": self.operatorElse,
            "(then)": self.operatorThen,
            "(map)": self.operatorMap,
            "(reduce)": self.operatorReduce,

            "=": self.operatorAssign,
            "+=": self.operatorPlusAssign,
            "-=": self.operatorMinusAssign,
            "/=": self.operatorDivAssign,
            "*=": self.operatorMulAssign,
            "+": self.operatorPlus,
            "-": self.operatorMinus,
            "/": self.operatorDiv,
            "*": self.operatorMul
        }
        self.position = 0
        self.prevPlace = None
        self.curPlace = None
        self.path = path
        self.context = context
    
    def findStartElements(self, entry):
        if entry == "this":
            self.curPlace = self.context
            self.position += 1
            return
        if entry == "global":
            self.curPlace = GLOBAL
            self.position += 1
            return
        if entry == "std":
            self.curPlace = StdLib
            self.position += 1
            return
        self.curPlace = GLOBAL

    def processStringEntry(self, entry):
        if self.position == 0 and self.curPlace is None:
            self.findStartElements(entry)
            return

        if entry in self.operators:
            place = self.prevPlace
            prevEntry = self.path[self.position-1]
            self.prevPlace = self.curPlace
            self.curPlace = lambda *args: self.operators[entry](
                place, prevEntry, args
            )
            self.position += 1
            return
        
        if self.curPlace is not None:
            self.prevPlace = self.curPlace
            self.curPlace = StdLib.getattr(self.curPlace, entry)
        self.position += 1

    def processArrayEntry(self, entry):
        args = []
        for item in entry:
            if item is not None and isinstance(item, Mapping):
                args.append(self.processObject(item))
            else:
                args.append(item)
        
        tmp = self.curPlace
        self.curPlace = self.curPlace(*args)
        self.prevPlace = tmp
        self.position += 1

    def processObjectEntry(self, entry):
        self.prevPlace = self.curPlace
        if self.position == 0 and self.curPlace is not None:
            self.findStartElements()
            
            self.prevPlace = self.curPlace
            self.curPlace = self.processObject(entry)
            self.position += 1
            
            return
        
        if self.curPlace is not None:
            self.curPlace = StdLib.getattr(
                self.curPlace,
                self.processObject(entry)
            )
        self.position += 1

    def processObject(self, obj):
        ctx = None
        
        if obj.get("@__raw", False): 
            if "@__last" in obj:
                return ["this", "(as-context)", [{"@__last": obj["@__last"]}]]
            return obj["@__expr"]

        if obj.get("@__follow_ctx", False):
            ctx = self.context
        if "@__expr" in obj:
            return Walker(obj["@__expr"], ctx or self.prevPlace).run()
        if "@__last" in obj:
            ret = None
            for expr in obj["@__last"]:
                ret = Walker(expr, ctx or self.prevPlace).run()
            return ret

        for key, value in obj.items():
            if value is not None and isinstance(value, Mapping):
                obj[key] = self.processObject(value)
        
        return obj

    def operatorAssign(self, obj, entry, args):
        StdLib.setattr(obj, entry, args[0])
        return args[0]
    
    def operatorPlusAssign(self, obj, entry, args):
        StdLib.setattr(obj, entry, StdLib.getattr(obj, entry) + args[0])
        return obj[entry]
    def operatorMinusAssign(self, obj, entry, args):
        StdLib.setattr(obj, entry, StdLib.getattr(obj, entry) - args[0])
        return obj[entry]

    def operatorDivAssign(self, obj, entry, args):
        StdLib.setattr(obj, entry, StdLib.getattr(obj, entry) / args[0])
        return obj[entry]

    def operatorMulAssign(self, obj, entry, args):
        StdLib.setattr(obj, entry, StdLib.getattr(obj, entry) * args[0])
        return obj[entry]

    def operatorPlus(self, obj, entry, args):
        return self.prevPlace + args[0]

    def operatorMinus(self, obj, entry, args):
        return self.prevPlace - args[0]
    
    def operatorDiv(self, obj, entry, args):
        return self.prevPlace / args[0]
    
    def operatorMul(self, obj, entry, args):
        return self.prevPlace * args[0]

    def operatorNew(self, obj, entry, args):
        return (self.prevPlace)(*args)

    def operatorAsContext(self, obj, entry, args):
        return args[0]

    def operatorThrough(self, obj, entry, args):
        return self.prevPlace

    def operatorThenElse(self, obj, entry, args):
        if self.prevPlace:
            return args[0]
        return args[1]

    def operatorElse(self, obj, entry, args):
        if not self.prevPlace:
            return args[0]
        return self.prevPlace

    def operatorThen(self, obj, entry, args):
        if self.prevPlace:
            return args[0]
        return self.prevPlace
    
    def operatorMap(self, obj, entry, args):
        fn = args[0]
        return [fn(item, i) for i, item in enumerate(self.prevPlace)]

    def operatorReduce(self, obj, entry, args):
        fn = args[1]
        acc = args[0]
        for i, item in enumerate(self.prevPlace):
            acc = fn(acc, item, i)
        return acc

    def run(self):
        while self.position < len(self.path):
            entry = self.path[self.position]
            if isinstance(entry, (str, int, float)):
                self.processStringEntry(entry)
            elif isinstance(entry, Sequence):
                self.processArrayEntry(entry)
            elif isinstance(entry, Mapping):
                self.processObjectEntry(entry)
            else:
                self.position += 1
        
        return self.curPlace

false = False
true = True

Walker(["global","hornyJoin","=",[{"@__expr":["std","Fn",["joiner","arr",{"@__raw":true,"@__expr":["this","arr","(reduce)",[{"@__follow_ctx":true,"@__expr":["std","Obj",[{"@__follow_ctx":true,"@__expr":["std","Arr",["joiner",{"@__follow_ctx":true,"@__expr":["this","joiner"]}]]},{"@__expr":["std","Arr",["str",""]]}]]},{"@__expr":["std","Fn",["context","item","i",{"@__raw":true,"@__last":[["this","context","str","+=",[{"@__follow_ctx":true,"@__expr":["this","i","(then-else)",[{"@__follow_ctx":true,"@__expr":["this","context","joiner"]},""],"+",[{"@__follow_ctx":true,"@__expr":["std","Str",[{"@__follow_ctx":true,"@__expr":["this","item"]}]]}]]}]],["this","context"]]}]]}],"str"]}]]}]]).run()

