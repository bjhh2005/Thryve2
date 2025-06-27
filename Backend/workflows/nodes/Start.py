from .MessageNode import MessageNode

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
        self._eventBus.emit("Message",self.id+":executing")
        print(self._nextNodes)
        self.updateNext()

    def updateNext(self):
        self._eventBus.emit("Message",self.id+": executed")
        self._next = self._nextNodes[0][1]