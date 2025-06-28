from .MessageNode import MessageNode
import re
from collections import Counter
from typing import Dict, Any, Optional, List

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
            return True
            
        except Exception as e:
            raise Exception(f"文本处理节点 {self._id} 执行错误: {str(e)}", 9)

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            raise Exception(f"节点 {self._id}: 缺少后续节点配置",9)
        self._next = self._nextNodes[0][1]

    def _append_text(self) -> Dict[str, Any]:
        try:
            with open(self.input_file, 'a', encoding='utf-8') as f:
                f.write(self.content)
            self._eventBus.emit("message", "info", self._id, "Append text success!")
            return {}
        except Exception as e:
            raise RuntimeError(f"追加文本时发生错误: {str(e)}",9)

    def _replace_text(self) -> Dict[str, Any]:
        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                content = f.read()

            if self.use_regex:
                # 使用正则表达式进行替换
                replaced_content = re.sub(self.search_text, self.replace_text, content)
                replacement_count = len(re.findall(self.search_text, content))
            else:
                # 普通文本替换
                replacement_count = content.count(self.search_text)
                replaced_content = content.replace(self.search_text, self.replace_text)

            with open(self.input_file, 'w', encoding='utf-8') as f:
                f.write(replaced_content)
            self._eventBus.emit("message", "info", self._id, "Replace text success!")
            return {"replacementCount": replacement_count}
        except Exception as e:
            raise RuntimeError(f"替换文本时发生错误: {str(e)}",9)

    def _write_text(self) -> Dict[str, Any]:
        try:
            with open(self.input_file, 'w', encoding='utf-8') as f:
                f.write(self.content)
            self._eventBus.emit("message", "info", self._id, "Write text success!")
            return {}
        except Exception as e:
            raise RuntimeError(f"写入文本时发生错误: {str(e)}",9)

    def _word_frequency(self) -> Dict[str, Any]:
        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                content = f.read()

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
            #print(frequencies)
            self._eventBus.emit("message", "info", self._id, "Word frequency success!")
            return {
                "statistics": {
                    "totalWords": len(words),
                    "uniqueWords": len(word_counts),
                    "frequencies": frequencies
                }
            }
        except Exception as e:
            raise RuntimeError(f"统计词频时发生错误: {str(e)}",9)
