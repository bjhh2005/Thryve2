import json
import os

def pretty_print_dict(d: dict, indent: int = 2, ensure_ascii: bool = False):
    """
    美观地打印字典内容，支持缩进和中文，并将内容写入当前目录下的 dict_view.md 文件。
    :param d: 需要打印的字典
    :param indent: 缩进空格数
    :param ensure_ascii: 是否只输出 ASCII 字符（False 可输出中文）
    """
    content = json.dumps(d, indent=indent, ensure_ascii=ensure_ascii)
    print(content)
    # 写入 markdown 文件
    md_path = os.path.join(os.path.dirname(__file__), 'dict_view.md')
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write('```json\n')
        f.write(content)
        f.write('\n```\n') 