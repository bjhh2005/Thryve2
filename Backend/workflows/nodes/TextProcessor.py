from .MessageNode import MessageNode
import re
from collections import Counter
from typing import Dict, Any, Optional, List
import os

class TextProcessor(MessageNode):
    def __init__(self, id: str, type: str, nextNodes: List, eventBus, data: Dict):
        """
        初始化文本处理节点
        
        Args:
            id (str): 节点ID
            type (str): 节点类型
            nextNodes (list): 下一个节点列表
            eventBus: 事件总线
            data (dict): 节点数据
        """
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.mode = data.get('mode', '')
        self.input_file = None
        self.content = None
        self.search_text = None
        self.replace_text = None
        self.use_regex = False
        self.ignore_case = False
        self.min_length = 1
        
        # 获取输出路径配置
        self.output_folder = self._get_input_value(data, 'outputFolder') or "output"
        self.output_name = self._get_input_value(data, 'outputFileName') or "output"
        
        # 确保输出目录存在
        if not os.path.exists(self.output_folder):
            os.makedirs(self.output_folder)

    def _get_input_value(self, data: Dict[str, Any], key: str) -> Any:
        """从inputsValues中获取值，处理constant和ref两种类型"""
        if key not in data.get('inputsValues', {}):
            return None
        
        value_data = data['inputsValues'][key]
        if value_data.get("type") == "constant":
            return value_data.get("content")
        elif value_data.get("type") == "ref":
            # 通过EventBus获取ref类型的值
            content = value_data.get("content", [])
            if len(content) >= 2:
                node_id = content[0]
                if node_id.endswith("_locals"):
                    node_id = node_id[:-7]
                param_name = content[1]
                return self._eventBus.emit("askMessage", node_id, param_name)
        return None

    def run(self) -> bool:
        """
        执行文本处理节点
        
        Returns:
            bool: 执行是否成功
        """
        try:
            # 从data中获取输入值
            self.input_file = self._get_input_value(self.data, 'inputFile')
            
            # 根据不同模式执行相应操作
            if self.mode == 'append':
                self.content = self._get_input_value(self.data, 'content')
                result = self._append_text()
            elif self.mode == 'replace':
                self.search_text = self._get_input_value(self.data, 'searchText')
                self.replace_text = self._get_input_value(self.data, 'replaceText')
                self.use_regex = self._get_input_value(self.data, 'useRegex')
                if self.use_regex == None:
                    self.use_regex = False
                result = self._replace_text()
            elif self.mode == 'write':
                self.content = self._get_input_value(self.data, 'content')
                result = self._write_text()
            elif self.mode == 'wordFreq':
                self.ignore_case = self._get_input_value(self.data, 'ignoreCase')
                if self.ignore_case == None:
                    self.ignore_case = False
                self.min_length = self._get_input_value(self.data, 'minLength')
                result = self._word_frequency()
            else:
                raise ValueError(f"不支持的操作模式: {self.mode}")

            # 更新消息
            self.MessageList=result
            
            # 更新下一个节点
            self.updateNext()
            return self.MessageList
            
        except Exception as e:
            raise Exception(f"文本处理节点 {self._id} 执行错误: {str(e)}", 9)

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            raise Exception(f"节点 {self._id}: 缺少后续节点配置",9)
        self._next = self._nextNodes[0][1]

    def _get_output_file(self) -> str:
        """
        根据输入文件的扩展名生成输出文件路径
        
        Returns:
            str: 输出文件路径
        """
        # 获取输入文件的扩展名
        _, ext = os.path.splitext(self.input_file)
        if not ext:  # 如果没有扩展名，默认使用.txt
            ext = '.txt'
            
        # 创建输出文件路径
        output_file = os.path.join(self.output_folder, f"{self.output_name}{ext}")
        return self._get_unique_filename(output_file)

    def _read_file_with_encoding(self, file_path: str) -> tuple[str, str]:
        """
        使用多种编码尝试读取文件
        
        Args:
            file_path (str): 文件路径
            
        Returns:
            tuple[str, str]: (文件内容, 使用的编码)
            
        Raises:
            RuntimeError: 当所有编码都无法成功读取文件时抛出
        """
        encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'latin1']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                    return content, encoding
            except UnicodeDecodeError:
                continue
                
        raise RuntimeError("无法使用支持的编码格式读取文件，请检查文件编码")

    def _write_file_with_encoding(self, file_path: str, content: str, encoding: str = 'utf-8') -> None:
        """
        使用指定编码写入文件
        
        Args:
            file_path (str): 文件路径
            content (str): 要写入的内容
            encoding (str): 编码格式，默认utf-8
        """
        try:
            with open(file_path, 'w', encoding=encoding) as f:
                f.write(content)
        except UnicodeEncodeError:
            # 如果指定编码无法编码内容，回退到UTF-8
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

    def _append_text(self) -> Dict[str, Any]:
        try:
            # 读取原文件内容
            original_content, input_encoding = self._read_file_with_encoding(self.input_file)
            
            # 创建新的输出文件
            output_file = self._get_output_file()
            
            # 写入原内容和新内容
            self._write_file_with_encoding(output_file, original_content + self.content, input_encoding)
                
            self._eventBus.emit("message", "info", self._id, f"Append text success! (Encoding: {input_encoding})")
            return {
                "outputFile": output_file,
                "inputEncoding": input_encoding,
                "outputEncoding": input_encoding
            }
        except Exception as e:
            raise RuntimeError(f"追加文本时发生错误: {str(e)}",9)

    def _replace_text(self) -> Dict[str, Any]:
        try:
            # 读取文件内容
            content, input_encoding = self._read_file_with_encoding(self.input_file)

            if self.use_regex:
                # 使用正则表达式进行替换
                replaced_content = re.sub(self.search_text, self.replace_text, content)
                replacement_count = len(re.findall(self.search_text, content))
            else:
                # 普通文本替换
                replacement_count = content.count(self.search_text)
                replaced_content = content.replace(self.search_text, self.replace_text)

            # 创建新的输出文件
            output_file = self._get_output_file()
            
            # 写入替换后的内容
            self._write_file_with_encoding(output_file, replaced_content, input_encoding)
                
            self._eventBus.emit("message", "info", self._id, f"Replace text success! (Encoding: {input_encoding})")
            return {
                "outputFile": output_file,
                "inputEncoding": input_encoding,
                "outputEncoding": input_encoding,
                "replacementCount": replacement_count
            }
        except Exception as e:
            raise RuntimeError(f"替换文本时发生错误: {str(e)}",9)

    def _write_text(self) -> Dict[str, Any]:
        try:
            # 创建新的输出文件
            output_file = self._get_output_file()
            
            # 写入内容（使用UTF-8编码，因为这是新内容）
            self._write_file_with_encoding(output_file, self.content, 'utf-8')
                
            self._eventBus.emit("message", "info", self._id, "Write text success! (Encoding: utf-8)")
            return {
                "outputFile": output_file,
                "outputEncoding": "utf-8"
            }
        except Exception as e:
            raise RuntimeError(f"写入文本时发生错误: {str(e)}",9)

    def _word_frequency(self) -> Dict[str, Any]:
        try:
            # 尝试不同的编码格式
            encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'latin1']
            content = None
            used_encoding = None  # 记录成功读取文件的编码格式
            
            for encoding in encodings:
                try:
                    with open(self.input_file, 'r', encoding=encoding) as f:
                        content = f.read()
                        used_encoding = encoding  # 保存成功的编码格式
                        break  # 如果成功读取，跳出循环
                except UnicodeDecodeError:
                    continue
            
            if content is None:
                raise RuntimeError("无法使用支持的编码格式读取文件，请检查文件编码")

            # 如果忽略大小写，将所有文本转换为小写
            if self.ignore_case:
                content = content.lower()

            # 使用正则表达式分割单词
            words = re.findall(r'\b\w+\b', content)
            
            # 过滤掉小于最小长度的单词
            words = [word for word in words if len(word) >= self.min_length]

            # 使用Counter统计词频
            word_counts = Counter(words)

            # 构建返回结果
            frequencies = {
                word: count for word, count in word_counts.items()
            }
            
            # 将结果写入输出文件（词频分析结果总是输出为txt格式）
            output_file = os.path.join(self.output_folder, f"{self.output_name}_frequency.txt")
            output_file = self._get_unique_filename(output_file)
            
            # 始终使用UTF-8编码写入输出文件
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"Input file encoding: {used_encoding}\n")
                f.write("Word Frequency Analysis Results:\n\n")
                f.write(f"Total Words: {len(words)}\n")
                f.write(f"Unique Words: {len(word_counts)}\n\n")
                f.write("Word Frequencies:\n")
                for word, count in sorted(frequencies.items()):
                    f.write(f"{word}: {count}\n")
            
            self._eventBus.emit("message", "info", self._id, f"Word frequency analysis success! (Input encoding: {used_encoding})")
            return {
                "outputFile": output_file,
                "inputEncoding": used_encoding,
                "outputEncoding": "utf-8",
                "statistics": {
                    "totalWords": len(words),
                    "uniqueWords": len(word_counts),
                    "frequencies": frequencies
                }
            }
        except Exception as e:
            raise RuntimeError(f"统计词频时发生错误: {str(e)}",9)

    def _get_unique_filename(self, filepath: str) -> str:
        """
        生成不重复的文件名。如果文件已存在，在文件名后添加序号。
        
        Args:
            filepath (str): 原始文件路径
            
        Returns:
            str: 不重复的文件路径
        """
        if not os.path.exists(filepath):
            return filepath
            
        directory = os.path.dirname(filepath)
        filename = os.path.basename(filepath)
        name, ext = os.path.splitext(filename)
        
        counter = 1
        while True:
            new_filepath = os.path.join(directory, f"{name}_{counter}{ext}")
            if not os.path.exists(new_filepath):
                return new_filepath
            counter += 1
