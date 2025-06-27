from .Node import Node
import os
from typing import Dict, Any, List

class FileInput(Node):
    def __init__(self, id, type, nextNodes, eventBus, data):
        """
        初始化文件输入节点
        :param id: 节点唯一标识符
        :param type: 节点类型
        :param nextNodes: 邻接节点信息
        :param eventBus: 事件总线
        :param data: 节点数据，包含文件信息
        """
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.files: List[Dict[str, Any]] = []
        
        # 从data中获取文件配置
        if "files" in data:
            self.files = data["files"]

    def run(self):
        """
        执行文件输入操作
        验证文件路径并将路径信息发送到事件总线
        """
        try:
            results = {}
            
            # 处理每个配置的文件
            for file_config in self.files:
                file_id = file_config["id"]
                file_info = file_config["file"]
                variable_name = file_config["variableName"]
                
                file_path = file_info["filePath"]
                
                # 验证文件路径
                if not file_path:
                    raise ValueError(f"文件 {file_id} 的路径未指定")
                
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"文件不存在: {file_path}")

                # 将文件路径发送到事件总线
                self._eventBus.emit("setMessage", self._id, variable_name, file_path)
                
                # 保存结果
                results[variable_name] = {
                    "path": file_path,
                    "fileName": file_info["fileName"],
                    "mimeType": file_info["mimeType"],
                    "size": file_info["size"]
                }

            # 更新下一个节点
            self.updateNext()
            
            return {
                "status": "success",
                "results": results
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def updateNext(self):
        """
        更新下一个要执行的节点
        文件输入节点只有一个后续节点
        """
        if self._nextNodes and len(self._nextNodes) > 0:
            self._next = self._nextNodes[0][1]
        else:
            self._next = None
