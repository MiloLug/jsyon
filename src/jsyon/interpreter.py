from collections.abc import Sequence, Mapping
from .utils import jsyon_getattr, jsyon_setattr
from .operators import shorthands as operators_list

class Interpreter:
    def __init__(self, path, context=None):
        self.position = 0
        self.prev_point = None
        self.cur_point = None
        self.path = path
        self.context = context
    
    def find_start_point(self, entry):
        if entry == "this":
            self.cur_point = self.context
            self.position += 1
            return
        if entry == "global":
            self.cur_point = Global
            self.position += 1
            return
        self.cur_point = Global

    def process_string_entry(self, entry):
        if self.position == 0 and self.cur_point is None:
            self.find_start_point(entry)
            return

        if entry in operators_list:
            place = self.prev_point
            prev_entry = self.path[self.position-1]
            self.prev_point = self.cur_point
            self.cur_point = lambda *args: operators_list[entry](
                self, place, prev_entry, args
            )
            self.position += 1
            return
        
        if self.cur_point is not None:
            self.prev_point = self.cur_point
            self.cur_point = jsyon_getattr(self.cur_point, entry)
        self.position += 1

    def process_array_entry(self, entry):
        args = []
        for item in entry:
            if item is not None and isinstance(item, Mapping):
                args.append(self.process_object(item))
            else:
                args.append(item)
        
        tmp = self.cur_point
        self.cur_point = self.cur_point(*args)
        self.prev_point = tmp
        self.position += 1

    def process_object_entry(self, entry):
        self.prev_point = self.cur_point
        if self.position == 0 and self.cur_point is not None:
            self.find_start_point()
            
            self.prev_point = self.cur_point
            self.cur_point = self.process_object(entry)
            self.position += 1
            
            return
        
        if self.cur_point is not None:
            self.cur_point = jsyon_getattr(
                self.cur_point,
                self.process_object(entry)
            )
        self.position += 1

    def process_object(self, obj):
        ctx = None
        
        if obj.get("@__raw", False): 
            if "@__last" in obj:
                return ["this", "(as-context)", [{"@__last": obj["@__last"]}]]
            return obj["@__expr"]

        if obj.get("@__follow_ctx", False):
            ctx = self.context
        if "@__expr" in obj:
            return Interpreter(obj["@__expr"], ctx or self.prev_point).run()
        if "@__last" in obj:
            ret = None
            for expr in obj["@__last"]:
                ret = Interpreter(expr, ctx or self.prev_point).run()
            return ret

        for key, value in obj.items():
            if value is not None and isinstance(value, Mapping):
                obj[key] = self.process_object(value)
        
        return obj

    def run(self):
        while self.position < len(self.path):
            entry = self.path[self.position]
            if isinstance(entry, (str, int, float)):
                self.process_string_entry(entry)
            elif isinstance(entry, Sequence):
                self.process_array_entry(entry)
            elif isinstance(entry, Mapping):
                self.process_object_entry(entry)
            else:
                self.position += 1
        
        return self.cur_point


from ._global import Global

