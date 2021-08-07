from collections.abc import Sequence, Mapping
from .interpreter import Interpreter

NATIVE_SCOPE = {key: getattr(__builtins__, key) for key in dir(__builtins__)}

class Global:
    py = NATIVE_SCOPE
   
    @staticmethod
    def eval(body, context):
        return None

    zip = zip
    
    @staticmethod
    def eval(body, context):
        return None

    @staticmethod
    def print(*args):
        print(*args)
        return args

    Obj = lambda *args: dict(args)
    
    class Arr(list):
        def __init__(self, *args):
            super(Global.Arr, self).__init__(args)

        def push(self, item):
            self.append(item)
            return self

        def pop():
            return self.pop()

    @staticmethod
    def Fn(*args):
        body = args[-1];
        params = args[0:-1];
        return lambda *innerArgs: Interpreter(
            body,
            dict(zip(params, innerArgs))
        ).run()

    Num = float
    Str = str

