from typing import Dict, Any, List
import json
import requests
from .Node import Node

class LLMError(Exception):
    """LLM处理错误"""
    pass

class LLMProcessor(Node):
    def __init__(self, id: str, type: str, nextNodes: list, eventBus: Any, data: Dict[str, Any]):
        """
        初始化LLM处理节点
        
        Args:
            id: 节点ID
            type: 节点类型
            nextNodes: 下一个节点列表
            eventBus: 事件总线
            data: 节点数据
        """
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.inputs = data.get("inputsValues", {})
        self.MessageList = {}

    def _get_input_value(self, value):
        """获取输入值，处理引用类型"""
        if isinstance(value, dict):
            if value.get("type") == "ref":
                content = value.get("content", [])
                if len(content) >= 2:
                    node_id = content[0]
                    param_name = content[1]
                    result = self._eventBus.emit("askMessage", node_id, param_name)
                    self._eventBus.emit("message", "info", self._id, f"获取引用值 {node_id}.{param_name} = {result}")
                    return result
            elif value.get("type") == "constant":
                return value.get("content", "")
        return str(value) if value is not None else ""

    def call_llm_api(self) -> Dict[str, Any]:
        """调用LLM API"""
        try:
            # 获取输入参数
            model_name = self._get_input_value(self.inputs.get("modelName"))
            api_key = self._get_input_value(self.inputs.get("apiKey"))
            api_host = self._get_input_value(self.inputs.get("apiHost"))
            temperature = float(self._get_input_value(self.inputs.get("temperature", 0.7)))
            system_prompt = self._get_input_value(self.inputs.get("systemPrompt", "You are an AI assistant."))
            prompt = self._get_input_value(self.inputs.get("prompt"))

            self._eventBus.emit("message", "info", self._id, f"准备调用LLM API，模型：{model_name}")

            if not all([model_name, api_key, api_host, prompt]):
                raise LLMError("必要的参数不完整")

            # 构建请求
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }

            data = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature
            }

            # 发送请求
            try:
                response = requests.post(
                    f"{api_host}/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=30
                )
                response.raise_for_status()
                result = response.json()
                
                # 提取回复内容
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    self._eventBus.emit("message", "info", self._id, "LLM调用成功")
                    return {
                        "result": content
                    }
                else:
                    raise LLMError("API响应格式不正确")

            except requests.exceptions.RequestException as e:
                raise LLMError(f"API请求失败: {str(e)}")

        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"LLM调用失败: {str(e)}")
            raise LLMError(f"LLM调用失败: {str(e)}")

    def run(self):
        """
        执行LLM处理节点
        """
        try:
            # 调用LLM API
            result = self.call_llm_api()
            
            # 更新MessageList
            self.MessageList.update(result)
            
            # 将结果转换为字符串
            result_str = json.dumps(result, ensure_ascii=False)
            
            # 发送处理结果
            self._eventBus.emit("nodes_output", self._id, result_str)
            
            # 更新下一个节点
            self.updateNext()
            return True

        except LLMError as e:
            self._eventBus.emit("message", "error", self._id, str(e))
            raise Exception(f"LLM处理节点 {self._id} 执行错误: {str(e)}", 1)

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            self._eventBus.emit("message", "warning", self._id, "No next node")
            return
        self._next = self._nextNodes[0][1]
