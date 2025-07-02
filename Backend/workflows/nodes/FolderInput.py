from .MessageNode import MessageNode
from typing import Dict, Any, List

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
            data: 节点数据，包含文件夹信息和输出配置
            
        Raises:
            FolderInputError: 当初始化参数无效时
        """
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)
        
        self.MessageList = {}
        
        # 验证folders配置
        folders = data.get('folders')
        if not folders or not isinstance(folders, list):
            raise FolderInputError(f"节点 {id} 缺少有效的folders配置",11)

        # 验证outputs配置
        outputs = data.get('outputs')
        if not outputs or not isinstance(outputs, dict):
            raise FolderInputError(f"节点 {id} 缺少有效的outputs配置",11)
            
        properties = outputs.get('properties')
        if not properties or not isinstance(properties, dict):
            raise FolderInputError(f"节点 {id} 缺少有效的properties配置",11)

        # 初始化消息列表
        try:
            for propName, propInfo in properties.items():
                if not isinstance(propInfo, dict):
                    raise FolderInputError(f"节点 {id} 的属性 {propName} 配置无效",11)
                    
                # 处理文件夹路径和文件列表
                if propName.endswith('_files'):
                    # 文件列表属性 - 只存储非目录文件的路径
                    file_list = []
                    default_files = propInfo.get('default', [])
                    for file_info in default_files:
                        if isinstance(file_info, dict) and not file_info.get('isDirectory', False):
                            file_list.append(file_info['path'])
                    self.MessageList[propName] = file_list
                else:
                    # 文件夹路径属性
                    self.MessageList[propName] = propInfo.get('default', '')
                    
        except Exception as e:
            raise FolderInputError(f"节点 {id} 初始化属性失败: {str(e)}",11)

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
            #self._eventBus.emit("message", "info", self._id, "Folder input success!")
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
