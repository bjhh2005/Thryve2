from typing import Dict, Any, List, Union, TypedDict
import json
import requests
from .MessageNode import MessageNode
import urllib3
from urllib3 import Retry
from urllib.parse import urljoin
import base64
import os
import mimetypes
from pathlib import Path

# 禁用不安全的HTTPS警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class LLMError(Exception):
    """LLM处理错误"""
    pass

class ImageUrl(TypedDict):
    url: str

class ImageContent(TypedDict):
    type: str
    image_url: ImageUrl

class Message(TypedDict):
    role: str
    content: Union[str, List[ImageContent]]

class LLMProcessor(MessageNode):
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
        if value is None:
            return ""
            
        if isinstance(value, dict):
            if isinstance(value.get("type"), str):
                if value["type"] == "ref":
                    content = value.get("content", [])
                    if len(content) >= 2:
                        node_id = content[0]
                        if node_id.endswith("_locals"):
                            node_id = node_id[:-7]
                        param_name = content[1]
                        result = self._eventBus.emit("askMessage", node_id, param_name)
                        self._eventBus.emit("message", "info", self._id, f"获取引用值 {node_id}.{param_name} = {result}")
                        return result
                elif value["type"] == "constant":
                    return str(value.get("content", ""))
            return str(value)
            
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

    def _process_file(self, file_data: Dict[str, Any]) -> Dict[str, str]:
        """
        处理文件，将文件转换为适合API发送的格式
        
        Args:
            file_data: 包含文件信息的字典，需要包含path和name字段
            
        Returns:
            Dict包含文件类型和内容
        """
        try:
            # 确保 file_data 是字典类型
            if not isinstance(file_data, dict):
                self._eventBus.emit("message", "error", self._id, f"文件数据格式错误: {file_data}")
                raise LLMError("文件数据必须是字典类型")

            file_path = file_data.get('path')
            file_name = file_data.get('name')
            
            if not file_path or not file_name:
                raise LLMError("文件信息不完整")
                
            # 获取文件类型
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                # 根据文件扩展名判断类型
                ext = os.path.splitext(file_path)[1].lower()
                if ext in ['.txt', '.md', '.json', '.csv']:
                    mime_type = 'text/plain'
                elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
                    mime_type = f'image/{ext[1:]}'
                else:
                    mime_type = 'application/octet-stream'
                
            try:
                # 读取文件内容
                with open(file_path, 'rb') as f:
                    if mime_type.startswith('text/'):
                        content = f.read().decode('utf-8')
                        # 限制文本长度，防止超出API限制
                        if len(content) > 10000:  # 设置一个合理的限制
                            content = content[:10000] + "\n... (内容已截断)"
                    else:
                        content = base64.b64encode(f.read()).decode('utf-8')
                    
                    return {
                        "type": mime_type,
                        "name": file_name,
                        "content": content
                    }
            except UnicodeDecodeError:
                # 如果UTF-8解码失败，尝试其他编码
                with open(file_path, 'rb') as f:
                    content = f.read()
                    try:
                        content = content.decode('gbk')
                    except UnicodeDecodeError:
                        try:
                            content = content.decode('gb2312')
                        except UnicodeDecodeError:
                            # 如果所有编码都失败，则作为二进制处理
                            content = base64.b64encode(content).decode('utf-8')
                            mime_type = 'application/octet-stream'
                    
                    return {
                        "type": mime_type,
                        "name": file_name,
                        "content": content
                    }
                    
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"处理文件失败: {str(e)}")
            raise LLMError(f"文件处理失败: {str(e)}")

    def _prepare_messages(self, system_prompt: str, prompt: str, files: List[Dict[str, Any]]) -> List[Message]:
        """
        准备发送给API的消息，包括文本和文件
        """
        messages: List[Message] = [{"role": "system", "content": system_prompt}]
        
        # 处理文件，同时记录文件名信息用于日志显示
        processed_files_info = []  # 记录处理的文件信息
        if files:
            file_contents = []
            for file_data in files:
                try:
                    # 如果file_data是字符串（文件路径），转换为字典格式
                    if isinstance(file_data, str):
                        # 从路径中提取文件名
                        file_name = os.path.basename(file_data)
                        file_data = {
                            "path": file_data,
                            "name": file_name
                        }
                    # 如果file_data已经是字典，但缺少name字段
                    elif isinstance(file_data, dict) and "path" in file_data and "name" not in file_data:
                        file_data["name"] = os.path.basename(file_data["path"])
                        
                    processed_file = self._process_file(file_data)
                    if processed_file["type"].startswith("image/"):
                        # 对于图片，我们将其作为单独的消息
                        messages.append({
                            "role": "user",
                            "content": [
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{processed_file['type']};base64,{processed_file['content']}"
                                    }
                                }
                            ]
                        })
                        # 记录图片文件信息
                        processed_files_info.append({
                            "type": "image",
                            "name": processed_file['name'],
                            "message_index": len(messages) - 1
                        })
                        file_contents.append(f"[图片: {processed_file['name']}]")
                    else:
                        # 对于文本文件，我们收集其内容
                        file_contents.append(f"文件 '{processed_file['name']}' 的内容：\n{processed_file['content']}\n")
                        # 记录文本文件信息
                        processed_files_info.append({
                            "type": "text",
                            "name": processed_file['name']
                        })
                except Exception as e:
                    self._eventBus.emit("message", "error", self._id, f"处理文件失败: {str(e)}")
            
            # 如果有文本文件内容，将它们合并到一个消息中
            if file_contents:
                text_content = "\n".join(file_contents)
                messages.append({
                    "role": "user",
                    "content": text_content
                })

        # 添加用户提示
        messages.append({"role": "user", "content": prompt})
        
        # 创建用于日志显示的消息副本（简化图片内容）
        log_messages = []
        for i, msg in enumerate(messages):
            log_msg = {"role": msg["role"]}
            if isinstance(msg["content"], list):
                # 处理包含图片的消息
                simplified_descriptions = []
                for item in msg["content"]:
                    if item.get("type") == "image_url":
                        # 查找对应的文件名信息
                        file_name = "[图片文件]"  # 默认描述
                        for file_info in processed_files_info:
                            if file_info["type"] == "image" and file_info["message_index"] == i:
                                file_name = f"[图片: {file_info['name']}]"
                                break
                        simplified_descriptions.append(file_name)
                    else:
                        simplified_descriptions.append(str(item))
                log_msg["content"] = " ".join(simplified_descriptions)
            else:
                # 对于文本内容，如果太长则截断
                content = str(msg["content"])
                if len(content) > 500:
                    log_msg["content"] = content[:500] + "... (内容已截断)"
                else:
                    log_msg["content"] = content
            log_messages.append(log_msg)
        
        # 打印简化后的消息内容以便调试
        self._eventBus.emit("message", "info", self._id, f"准备发送的消息: {json.dumps(log_messages, ensure_ascii=False)}")
        
        return messages

    def _process_response_content(self, content: str, output_folder: str = "", output_name: str = "") -> Dict[str, Any]:
        """
        处理API响应内容，识别并处理文件生成指令
        
        Returns:
            Dict包含处理后的内容和生成的文件路径（如果有）
        """
        try:
            result = {
                "result": content,
                "outputFile": None
            }
            
            # 如果指定了输出文件夹和文件名，直接将内容保存为文件
            if output_folder and output_name:
                os.makedirs(output_folder, exist_ok=True)
                output_path = os.path.join(output_folder, output_name)
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                result["outputFile"] = output_path
                return result
            
            # 检查是否包含文件生成指令
            if "```file:" in content:
                parts = content.split("```file:")
                processed_parts = []
                
                for part in parts:
                    if part.strip():
                        if "\n```" in part:
                            file_info, rest = part.split("\n```", 1)
                            file_name = file_info.strip()
                            file_content = part[:part.find("\n```")].strip()
                            
                            # 使用指定的输出文件夹，如果没有则使用默认的
                            output_dir = output_folder if output_folder else "workflow_output"
                            os.makedirs(output_dir, exist_ok=True)
                            
                            # 使用指定的文件名，如果没有则使用AI生成的
                            final_name = output_name if output_name else file_name
                            file_path = os.path.join(output_dir, final_name)
                            
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(file_content)
                            
                            processed_parts.append(f"已生成文件: {file_path}\n{rest}")
                            result["outputFile"] = file_path
                        else:
                            processed_parts.append(part)
                
                result["result"] = "\n".join(processed_parts)
            
            return result
            
        except Exception as e:
            self._eventBus.emit("message", "error", self._id, f"处理响应内容时出错: {str(e)}")
            return {"result": content, "outputFile": None}

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
            
            # 获取输入文件列表（可选）
            input_files = self._get_input_value(self.inputs.get("inputFiles", "[]"))
            
            # 处理输入文件格式
            if isinstance(input_files, str):
                try:
                    input_files = json.loads(input_files)
                except json.JSONDecodeError:
                    input_files = []
            
            # 如果input_files是列表，检查每个元素
            if isinstance(input_files, list):
                processed_files = []
                for file_item in input_files:
                    # 如果是字典类型，直接使用
                    if isinstance(file_item, dict):
                        if "path" in file_item:
                            processed_files.append(file_item)
                    # 如果是字符串类型，创建字典
                    elif isinstance(file_item, str):
                        processed_files.append({
                            "path": file_item,
                            "name": os.path.basename(file_item)
                        })
                input_files = processed_files
            else:
                self._eventBus.emit("message", "error", self._id, f"输入文件格式错误: {input_files}")
                input_files = []
            
            # 获取输出路径（可选）
            output_folder = self._get_input_value(self.inputs.get("outputFolder", ""))
            output_name = self._get_input_value(self.inputs.get("outputName", ""))

            self._eventBus.emit("message", "info", self._id, f"原始 API 主机地址: {api_host}")
            if input_files:
                self._eventBus.emit("message", "info", self._id, f"处理文件数量: {len(input_files)}")

            if not all([model_name, api_key, api_host, prompt]):
                raise LLMError("必要的参数不完整")

            # 规范化 API 主机地址并构建完整的 URL
            api_host = self._normalize_api_host(api_host)
            # 确保使用正确的API端点
            if not api_host.endswith('/v1'):
                api_host = api_host.rstrip('/') + '/v1'
            api_url = urljoin(api_host, 'chat/completions')

            self._eventBus.emit("message", "info", self._id, f"规范化后的API URL: {api_url}")

            # 准备消息，包括文件处理
            messages = self._prepare_messages(system_prompt, prompt, input_files if input_files else [])

            # 构建请求
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }

            # 确保消息格式正确
            for msg in messages:
                if not isinstance(msg.get("content"), (str, list)):
                    msg["content"] = str(msg["content"])

            data = {
                "model": model_name,
                "messages": messages,
                "temperature": min(max(temperature, 0), 2),  # 确保温度在0-2之间
                "max_tokens": 4096,
                "stream": False,
                "top_p": 1
            }

            # 打印请求数据以便调试
            self._eventBus.emit("message", "info", self._id, f"请求数据: {json.dumps(data, ensure_ascii=False)}")

            # 发送请求
            try:
                session = requests.Session()
                retries = urllib3.Retry(total=3, backoff_factor=0.5)
                adapter = requests.adapters.HTTPAdapter(max_retries=retries)
                session.mount('http://', adapter)
                session.mount('https://', adapter)
                
                self._eventBus.emit("message", "info", self._id, f"正在调用API: {api_url}")
                
                response = session.post(
                    api_url,
                    headers=headers,
                    json=data,
                    timeout=30,
                    verify=False
                )

                if response.status_code != 200:
                    error_msg = f"API请求失败: {response.status_code} - {response.text}"
                    self._eventBus.emit("message", "error", self._id, error_msg)
                    raise LLMError(error_msg)

                result = response.json()
                
                # 提取回复内容
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    self._eventBus.emit("message", "info", self._id, "LLM调用成功")
                    
                    # 处理响应中可能包含的文件生成指令
                    processed_result = self._process_response_content(
                        content,
                        output_folder,
                        output_name
                    )
                    
                    return processed_result
                else:
                    raise LLMError("API响应格式不正确")

            except requests.exceptions.RequestException as e:
                error_msg = f"API请求失败: {str(e)}"
                self._eventBus.emit("message", "error", self._id, error_msg)
                raise LLMError(error_msg)

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
            return self.MessageList

        except LLMError as e:
            self._eventBus.emit("message", "error", self._id, str(e))
            raise Exception(f"LLM处理节点 {self._id} 执行错误: {str(e)}", 1)

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            self._eventBus.emit("message", "warning", self._id, "No next node")
            return
        self._next = self._nextNodes[0][1]
