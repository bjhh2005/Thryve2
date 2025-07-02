from .MessageNode import MessageNode
from typing import Dict, Any, List
import os

class FolderInputError(Exception):
    """文件夹输入节点错误"""
    pass

class FolderInput(MessageNode):

    def __init__(self, id, type, nextNodes, eventBus, data: Dict[str, Any]):
        """
        初始化文件夹输入节点
        
        Args:
            id: 节点ID
            type: 节点类型
            nextNodes: 下一个节点列表
            eventBus: 事件总线
            data: 节点数据
            
        Raises:
            FolderInputError: 当初始化参数无效时
        """
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)
        
        self.MessageList = {}
        
        # 验证data结构
        if not isinstance(data, dict):
            raise FolderInputError(f"节点 {id} 的data参数必须是字典类型")
            
        outputs = data.get('outputs')
        if not outputs or not isinstance(outputs, dict):
            raise FolderInputError(f"节点 {id} 缺少有效的outputs配置")
            
        properties = outputs.get('properties')
        if not properties or not isinstance(properties, dict):
            raise FolderInputError(f"节点 {id} 缺少有效的properties配置")

        # 获取folders配置
        folders = data.get('folders', [])
        if not isinstance(folders, list):
            raise FolderInputError(f"节点 {id} 的folders配置无效")

        # 初始化消息列表
        try:
            for propName, propInfo in properties.items():
                if not isinstance(propInfo, dict):
                    raise FolderInputError(f"节点 {id} 的属性 {propName} 配置无效",11)
                    
                # 处理文件夹路径和文件列表
                if propName.endswith('_files'):
                    # 文件列表属性 - 根据deepSearch决定是否递归处理
                    file_list = []
                    default_files = propInfo.get('default', [])
                    
                    # 获取对应的folder配置
                    folder_name = propName[:-6]  # 移除'_files'后缀
                    folder_config = next((f for f in folders if f.get('variableName') == folder_name), None)
                    deep_search = folder_config.get('deepSearch', False) if folder_config else False
                    
                    # 处理所有文件，包括子文件夹中的文件
                    for file_info in default_files:
                        if isinstance(file_info, dict) and 'path' in file_info:
                            self._add_files_recursively(file_info['path'], file_list, deep_search)
                                
                    self.MessageList[propName] = file_list
                else:
                    # 文件夹路径属性
                    self.MessageList[propName] = propInfo.get('default', '')
                    
        except Exception as e:
            raise FolderInputError(f"节点 {id} 初始化属性失败: {str(e)}",11)

    def _add_files_recursively(self, path: str, file_list: List[str], deep_search: bool):
        """
        递归处理文件列表，将所有文件（包括子文件夹中的文件）添加到同一个列表中
        
        Args:
            path: 文件或文件夹的路径
            file_list: 存储所有文件路径的列表
            deep_search: 是否进行深度搜索
        """
        try:
            if os.path.exists(path):
                if os.path.isdir(path):
                    if deep_search:
                        # 如果是目录且启用了深度搜索，递归处理
                        for item in os.listdir(path):
                            item_path = os.path.join(path, item)
                            self._add_files_recursively(item_path, file_list, deep_search)
                else:
                    # 如果是文件，添加到结果列表
                    file_list.append(path)
        except Exception as e:
            # 记录错误但继续处理
            self._eventBus.emit("message", "warning", self._id, f"处理文件 {path} 时出错: {str(e)}")

    def run(self):
        """
        运行文件夹输入节点
        
        Raises:
            FolderInputError: 当节点执行失败时
        """
        # 验证是否有下一个节点
        if not self._nextNodes:
            raise FolderInputError(f"节点 {self._id} 没有指定下一个节点",11)
            
        try:
            self.updateNext()
            return self.MessageList
        except Exception as e:
            raise FolderInputError(f"节点 {self._id} 执行失败: {str(e)}",11)

    def updateNext(self):
        """
        更新下一个节点
        
        Raises:
            FolderInputError: 当无法确定下一个节点时
        """
        if not self._nextNodes and not self._is_loop_internal:
            raise FolderInputError(f"节点 {self._id} 没有可用的下一个节点",11)
            
        self._next = self._nextNodes[0][1]
        if self._next is None:
            raise FolderInputError(f"节点 {self._id} 的下一个节点无效",11)
