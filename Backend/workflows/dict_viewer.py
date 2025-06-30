import json

def pretty_print_dict(d: dict, indent: int = 2, ensure_ascii: bool = False):
    """
    美观地打印字典内容，支持缩进和中文。
    :param d: 需要打印的字典
    :param indent: 缩进空格数
    :param ensure_ascii: 是否只输出 ASCII 字符（False 可输出中文）
    """
    print(json.dumps(d, indent=indent, ensure_ascii=ensure_ascii)) 