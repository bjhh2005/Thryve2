from .MessageNode import MessageNode

class StartNodeError(Exception):
    """Start节点执行时的异常"""
    pass


class Start(MessageNode):

    def __init__(self,id, type, nextNodes, eventBus, data):
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)

        print(data)

        property = data["outputs"]["properties"]
        self.MessageList = {}
        for propName,propInfo in property.items():
            prop_type = propInfo.get("type", '')
            if prop_type == 'object':
                self.MessageList[propName] = {}
            elif prop_type == "array":
                self.MessageList[propName] = []
            else:
                self.MessageList[propName] = propInfo.get('default', None)
        print(self.MessageList)

    def run(self):
        self._eventBus.emit("workflow", self._id)
<<<<<<< Updated upstream
=======
        self._eventBus.emit("message","info",self._id+":executing")
>>>>>>> Stashed changes
        print(self._nextNodes)
        self.updateNext()

    def updateNext(self):
<<<<<<< Updated upstream
        if not self._nextNodes:
            raise StartNodeError(f"节点 {self._id}: 缺少后续节点配置", 8)
=======
        self._eventBus.emit("message","info",self._id+": executed")
>>>>>>> Stashed changes
        self._next = self._nextNodes[0][1]