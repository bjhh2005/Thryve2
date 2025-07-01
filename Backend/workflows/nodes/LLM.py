from typing import Dict, Any, List
import json
import requests
from .Node import Node
import urllib3
from urllib.parse import urljoin

# 禁用不安全的HTTPS警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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
                    if node_id.endswith("_locals"):
                        node_id = node_id[:-7]
                    param_name = content[1]
                    result = self._eventBus.emit("askMessage", node_id, param_name)
                    self._eventBus.emit("message", "info", self._id, f"获取引用值 {node_id}.{param_name} = {result}")
                    return result
            elif value.get("type") == "constant":
                return value.get("content", "")
        # 如果值是字符串，清理可能的赋值语句格式
        if isinstance(value, str):
            # 移除可能的变量赋值格式
            if "=" in value:
                value = value.split("=")[-1].strip()
            # 移除引号
            value = value.strip('"').strip("'")
        return str(value) if value is not None else ""

    def _normalize_api_host(self, api_host: str) -> str:
        """规范化 API 主机地址"""
        # 移除可能的变量赋值格式
        if "=" in api_host:
            api_host = api_host.split("=")[-1].strip()
        
        # 移除引号
        api_host = api_host.strip('"').strip("'")
        
        # 移除 "apiHost" 或类似的变量名前缀
        prefixes_to_remove = ["apiHost", "api_host", "host", "url"]
        for prefix in prefixes_to_remove:
            if api_host.lower().startswith(prefix.lower()):
                api_host = api_host[len(prefix):].strip()
        
        # 确保 api_host 以 http:// 或 https:// 开头
        if not api_host.startswith(('http://', 'https://')):
            api_host = 'https://' + api_host
            
        # 移除末尾的斜杠，因为 urljoin 会处理这个
        api_host = api_host.rstrip('/')
        
        return api_host

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

            self._eventBus.emit("message", "info", self._id, f"原始 API 主机地址: {api_host}")

            if not all([model_name, api_key, api_host, prompt]):
                raise LLMError("必要的参数不完整")

            # 规范化 API 主机地址并构建完整的 URL
            api_host = self._normalize_api_host(api_host)
            api_url = urljoin(api_host, 'chat/completions')

            self._eventBus.emit("message", "info", self._id, f"规范化后的API URL: {api_url}")

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
                # 添加重试机制
                session = requests.Session()
                retries = urllib3.util.Retry(total=3, backoff_factor=0.5)
                adapter = requests.adapters.HTTPAdapter(max_retries=retries)
                session.mount('http://', adapter)
                session.mount('https://', adapter)
                
                self._eventBus.emit("message", "info", self._id, f"正在调用API: {api_url}")
                
                response = session.post(
                    api_url,
                    headers=headers,
                    json=data,
                    timeout=30,
                    verify=False  # 禁用SSL验证
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
