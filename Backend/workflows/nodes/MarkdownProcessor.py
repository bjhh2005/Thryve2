import os
import markdown
import frontmatter as fm
import yaml
from .MessageNode import MessageNode
#from ..dict_viewer import pretty_print_dict
from pygments.formatters import HtmlFormatter
import pypandoc

class MarkdownProcessorError(Exception):
    """MarkdownProcessor 节点执行时的异常"""
    pass

def generate_output_path(output_folder: str, output_name: str, ext: str = ".md") -> str:
    if not output_name.endswith(ext):
        output_name += ext
    print(output_folder, output_name)
    return os.path.join(output_folder, output_name)

class MarkdownProcessor(MessageNode):
    def __init__(self, id, type, nextNodes, eventBus, data):
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.mode = data.get("mode", "")
        self.inputs = data.get("inputsValues", {})
        self.output = None
        self.MessageList = {}
        #pretty_print_dict(self.data)

    def _get_input_value(self, value, default=None):
        if isinstance(value, dict):
            if value.get("type") == "ref":
                content = value.get("content", [])
                if len(content) >= 2:
                    node_id = content[0]
                    if node_id.endswith("_locals"):
                        node_id = node_id[:-7]
                    param_name = content[1]
                    result = self._eventBus.emit("askMessage", node_id, param_name)
                    self._eventBus.emit("message", "info", self._id, f"获取引用值 {node_id}.{param_name} = {result}")
                    return str(result) if result is not None else default
            elif value.get("type") == "constant":
                return str(value.get("content", default))
            elif "content" in value:
                # 兼容没有 type 字段但有 content 的情况（如 targetFormat）
                return str(value.get("content", default))
        return str(value) if value is not None else default

    def run(self):
        try:
            result = None
            if self.mode == "convert":
                result = self.handle_convert()
                self.MessageList = {"convertedFile": result.get("filePath")}
            elif self.mode == "write":
                result = self.handle_write()
                self.MessageList = {"outputFile": result.get("filePath")}
            elif self.mode == "append":
                result = self.handle_append()
                self.MessageList = {"outputFile": result.get("filePath")}
            elif self.mode == "frontMatter":
                result = self.handle_front_matter()
                self.MessageList = {"outputFile": result.get("filePath"), "metadata": result.get("frontMatter")}
            elif self.mode == "toc":
                result = self.handle_toc()
                self.MessageList = {"tableOfContents": result.get("toc")}
            elif self.mode == "lint":
                result = self.handle_lint()
                self.MessageList = result
            else:
                raise MarkdownProcessorError(f"未知的处理模式: {self.mode}")
            self.output = result
            self._eventBus.emit("nodes_output", self._id, str(self.MessageList))
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, str(e))
        self.updateNext()
        return True

    def handle_convert(self):
        input_file = self._get_input_value(self.inputs.get("inputFile"), "")
        target_format = self._get_input_value(self.inputs.get("targetFormat"), "html") or "html"
        output_folder = self._get_input_value(self.inputs.get("outputFolder"), "output") or "output"
        output_name = self._get_input_value(self.inputs.get("outputName"), f"output.{target_format}") or f"output.{target_format}"
        
        if target_format == "html" and not output_name.endswith('.html'):
            output_name += '.html'
        
        if target_format == "pdf" and not output_name.endswith('.pdf'):
            output_name += '.pdf'
        
        if not input_file or not os.path.exists(input_file):
            raise MarkdownProcessorError("未指定或找不到输入文件")
        
        
        with open(input_file, "r", encoding="utf-8") as f:
            md_text = f.read()
        
        

        
        html_body = markdown.markdown(md_text, extensions=['tables', 'fenced_code', 'codehilite'])
        html = self._get_html_with_style(html_body)
        os.makedirs(output_folder, exist_ok=True)
        output_file = generate_output_path(output_folder, output_name, f'.{target_format}')
        if target_format == "html":
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(html)
            self._eventBus.emit("message", "info", self._id, f"已转换为HTML: {output_file}")
            return {"filePath": output_file, "html": html}
        elif target_format == "pdf":
            try:
                # 使用 pypandoc 调用 pandoc，指定 pdf-engine 和中文字体
                pypandoc.convert_file(
                    input_file,
                    to='latex',
                    outputfile=output_file,
                    format='md',
                    # extra_args=[
                    #     '--pdf-engine=xelatex',
                    #     '-V', 'mainfont=Noto Sans CJK SC'
                    # ]
                    extra_args=['--pdf-engine=xelatex']
                )
            except Exception as e:
                raise MarkdownProcessorError(f"PDF 生成失败: {str(e)}。请确保 pandoc、xelatex 及中文字体已安装。")
            self._eventBus.emit("message", "info", self._id, f"已转换为PDF: {output_file}")
            return {"filePath": output_file}
        else:
            raise MarkdownProcessorError(f"暂不支持的目标格式: {target_format}")

    def handle_write(self):
        content = self._get_input_value(self.inputs.get("content"), "") or ""
        output_folder = self._get_input_value(self.inputs.get("outputFolder"), "output") or "output"
        output_name = self._get_input_value(self.inputs.get("outputName"), "output.md") or "output.md"
        os.makedirs(output_folder, exist_ok=True)
        output_file = generate_output_path(output_folder, output_name, ".md")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(content)
        self._eventBus.emit("message", "info", self._id, f"已写入Markdown文件: {output_file}")
        return {"filePath": output_file}

    def handle_append(self):
        input_file = self._get_input_value(self.inputs.get("inputFile"), "")
        content = self._get_input_value(self.inputs.get("content"), "") or ""
        if not input_file or not os.path.exists(input_file):
            raise MarkdownProcessorError("未指定或找不到输入文件")
        with open(input_file, "a", encoding="utf-8") as f:
            f.write("\n" + content)
        self._eventBus.emit("message", "info", self._id, f"已追加内容到: {input_file}")
        return {"filePath": input_file}

    def handle_front_matter(self):
        input_file = self._get_input_value(self.inputs.get("inputFile"), "")
        front_matter = self._get_input_value(self.inputs.get("frontMatter"), "")
        if not input_file or not os.path.exists(input_file):
            raise MarkdownProcessorError("未指定或找不到输入文件")
        with open(input_file, "r", encoding="utf-8") as f:
            post = fm.load(f)
        if front_matter:
            fm_dict = yaml.safe_load(front_matter)
            post.metadata.update(fm_dict)
            with open(input_file, "w", encoding="utf-8") as f:
                f.write(fm.dumps(post))
        self._eventBus.emit("message", "info", self._id, f"已更新front matter: {input_file}")
        return {"filePath": input_file, "frontMatter": post.metadata}

    def handle_toc(self):
        input_file = self._get_input_value(self.inputs.get("inputFile"), "")
        if not input_file or not os.path.exists(input_file):
            raise MarkdownProcessorError("未指定或找不到输入文件")
        with open(input_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        # 只识别以 # 开头且后面有空格的 Markdown 标题
        toc = [line.strip() for line in lines if line.lstrip().startswith('#') and len(line.lstrip()) > 1 and line.lstrip()[1] == ' ']
        self._eventBus.emit("message", "info", self._id, f"已生成目录，共{len(toc)}项")
        return {"toc": toc}

    def handle_lint(self):
        input_file = self._get_input_value(self.inputs.get("inputFile"), "")
        if not input_file or not os.path.exists(input_file):
            raise MarkdownProcessorError("未指定或找不到输入文件")
        with open(input_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        issues = []
        for i, line in enumerate(lines):
            if line.startswith("#") and line.strip() == "#":
                issues.append(f"Line {i+1}: 空标题")
        self._eventBus.emit("message", "info", self._id, f"lint完成，发现{len(issues)}个问题")
        return {"lintIssues": issues}

    def updateNext(self):
        if not self._nextNodes and not self._is_loop_internal:
            raise MarkdownProcessorError(f"节点 {self._id}: 缺少后续节点配置",7)
        self._next = self._nextNodes[0][1]

    def _get_html_with_style(self, html_body: str) -> str:
        pygments_css = HtmlFormatter().get_style_defs('.codehilite')
        table_css = '''
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 6px 12px; }
        th { background: #f8f8f8; }
        '''
        style_block = f"<style>{pygments_css}\n{table_css}</style>"
        mathjax_script = (
            '<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>'
        )
        return f"<!DOCTYPE html><html><head>{style_block}{mathjax_script}</head><body>{html_body}</body></html>" 