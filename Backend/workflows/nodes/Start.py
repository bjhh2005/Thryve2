from .MessageNode import MessageNode

class StartNodeError(Exception):
    """Start节点执行时的异常"""
    pass


class Start(MessageNode):

    def __init__(self, id, type, nextNodes, eventBus, data):
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)
        
        self.data = data
        self.MessageList = {}
        
        # 兼容新的数据格式，如果有outputsValues则处理，否则创建默认值
        if isinstance(data, dict) and "outputsValues" in data:
            # 处理新格式的输出配置
            outputs = data["outputsValues"]
            if isinstance(outputs, dict) and "properties" in outputs:
                # 如果有properties，按原逻辑处理
                property = outputs["properties"]
                for propName, propInfo in property.items():
                    prop_type = propInfo.get("type", '')
                    if prop_type == 'object':
                        self.MessageList[propName] = {}
                    elif prop_type == "array":
                        self.MessageList[propName] = []
                    else:
                        self.MessageList[propName] = propInfo.get('default', None)
            else:
                # 如果没有properties，创建默认的start输出
                self.MessageList = {"started": True, "timestamp": None}
        else:
            # 兼容旧格式或创建默认输出
            if isinstance(data, dict) and "outputs" in data and "properties" in data["outputs"]:
                # 旧格式
                property = data["outputs"]["properties"]
                for propName, propInfo in property.items():
                    prop_type = propInfo.get("type", '')
                    if prop_type == 'object':
                        self.MessageList[propName] = {}
                    elif prop_type == "array":
                        self.MessageList[propName] = []
                    else:
                        self.MessageList[propName] = propInfo.get('default', None)
            else:
                # 默认输出
                self.MessageList = {"started": True, "timestamp": None}

    def run(self):
        # 设置启动时间戳
        import datetime
        self.MessageList["timestamp"] = datetime.datetime.now().isoformat()
        
        self.updateNext()
        return self.MessageList

    def updateNext(self):
        if not self._nextNodes:
            raise StartNodeError(f"节点 {self._id}: 缺少后续节点配置", 8)
        self._next = self._nextNodes[0][1]