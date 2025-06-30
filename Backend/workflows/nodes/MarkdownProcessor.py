from .Node import Node

from ..dict_viewer import pretty_print_dict

class MarkdownProcessorError(Exception):
    """MarkdownProcessor 节点执行时的异常"""
    pass

class MarkdownProcessor(Node):
    def __init__(self, id, type, nextNodes, eventBus, data):
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.mode = data.get("inputsValues", {}).get("mode")
        self.inputs = data.get("inputsValues", {})
        self.output = None
        pretty_print_dict(self.data)

    def run(self):
        try:
            if self.mode == "parse":
                # 解析 markdown 文件为 HTML
                result = self.handle_parse()
            elif self.mode == "write":
                # 写入内容到 markdown 文件
                result = self.handle_write()
            elif self.mode == "append":
                # 追加内容到 markdown 文件
                result = self.handle_append()
            elif self.mode == "convert":
                # 转换 markdown 格式
                result = self.handle_convert()
            elif self.mode == "frontMatter":
                # 编辑 front matter
                result = self.handle_front_matter()
            elif self.mode == "toc":
                # 生成目录
                result = self.handle_toc()
            elif self.mode == "lint":
                # markdown 规范检查
                result = self.handle_lint()
            else:
                raise MarkdownProcessorError(f"未知的处理模式: {self.mode}")
            self.output = result
            self._eventBus.emit("nodes_output", self._id, str(result))
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, str(e))
        self.updateNext()
        return True

    def handle_parse(self):
        # TODO: 实现 markdown 解析为 HTML
        return "[parse] 未实现"

    def handle_write(self):
        # TODO: 实现写入内容到 markdown 文件
        return "[write] 未实现"

    def handle_append(self):
        # TODO: 实现追加内容到 markdown 文件
        return "[append] 未实现"

    def handle_convert(self):
        # TODO: 实现 markdown 格式转换
        return "[convert] 未实现"

    def handle_front_matter(self):
        # TODO: 实现 front matter 编辑
        return "[frontMatter] 未实现"

    def handle_toc(self):
        # TODO: 实现目录生成
        return "[toc] 未实现"

    def handle_lint(self):
        # TODO: 实现 markdown 规范检查
        return "[lint] 未实现"

    def updateNext(self):
        if not self._nextNodes and not self._is_loop_internal:
            raise MarkdownProcessorError(f"节点 {self._id}: 缺少后续节点配置",7)
        self._next = self._nextNodes[0][1] 