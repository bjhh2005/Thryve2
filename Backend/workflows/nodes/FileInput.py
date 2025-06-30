from .MessageNode import MessageNode
from typing import Dict, Any

class FileInputError(Exception):
    """文件输入节点错误"""
    pass

class FileInput(MessageNode):

    def __init__(self, id, type, nextNodes, eventBus, data: Dict[str, Any]):
        """
        初始化文件输入节点
        
        Args:
            id: 节点ID
            type: 节点类型
            nextNodes: 下一个节点列表
            eventBus: 事件总线
            data: 节点数据
            
        Raises:
            FileInputError: 当初始化参数无效时
        """
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)
        
        self.MessageList = {}
        

        # 验证data结构
        if not isinstance(data, dict):
            raise FileInputError(f"节点 {id} 的data参数必须是字典类型")
            
        outputs = data.get('outputs')
        if not outputs or not isinstance(outputs, dict):
            raise FileInputError(f"节点 {id} 缺少有效的outputs配置")
            
        properties = outputs.get('properties')
        if not properties or not isinstance(properties, dict):
            raise FileInputError(f"节点 {id} 缺少有效的properties配置")

        # 初始化消息列表
        try:
            for propName, propInfo in properties.items():
                if not isinstance(propInfo, dict):
                    raise FileInputError(f"节点 {id} 的属性 {propName} 配置无效")
                self.MessageList[propName] = propInfo.get('default', None)
        except Exception as e:
            raise FileInputError(f"节点 {id} 初始化属性失败: {str(e)}")

    def run(self):
        """
        运行文件输入节点
        
        Raises:
            FileInputError: 当节点执行失败时
        """
        # 验证是否有下一个节点
        if not self._nextNodes:
            raise FileInputError(f"节点 {self._id} 没有指定下一个节点")
            
        try:
            self._eventBus.emit("message", "info", self._id, "Fileinput success!")
            self.updateNext()
            return True
        except Exception as e:
            raise FileInputError(f"节点 {self._id} 执行失败: {str(e)}")

    def updateNext(self):
        """
        更新下一个节点
        
        Raises:
            FileInputError: 当无法确定下一个节点时
        """
        if not self._nextNodes and not self._is_loop_internal:
            raise FileInputError(f"节点 {self._id} 没有可用的下一个节点")
            
        self._next = self._nextNodes[0][1]
        if self._next is None:
            raise FileInputError(f"节点 {self._id} 的下一个节点无效")