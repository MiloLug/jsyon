from collections.abc import Sequence, Mapping


def jsyon_getattr(obj, attr_name):
    if isinstance(obj, Sequence):
        try:
            return obj[int(attr_name)]
        except (IndexError, ValueError) as e:
            pass

    if isinstance(obj, Mapping):
        try:
            return obj[attr_name]
        except (KeyError, TypeError) as e:
            pass
    
    try:
        return getattr(obj, str(attr_name), None)
    except TypeError as e:
        return None


def jsyon_setattr(obj, attr_name, attr_value):
    if isinstance(obj, Sequence):
        try:
            obj[int(attr_name)] = attr_value
            return attr_value
        except (IndexError, ValueError) as e:
            pass

    if isinstance(obj, Mapping):
        try:
            obj[attr_name] = attr_value
            return attr_value
        except (KeyError, TypeError) as e:
            pass
    
    try:
        setattr(obj, attr_name, attr_value)
        return attr_value
    except (TypeError, AttributeError) as e:
        return attr_value

