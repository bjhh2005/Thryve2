from .MessageNode import MessageNode

class FileInput(MessageNode):

    def __init__(self,id, type, nextNodes, eventBus, data):
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)

        
        self.MessageList = {}
        property=data['outputs']['properties']
        for propName,propInfo in property.items():
            self.MessageList[propName] = propInfo.get('default', None)
        print(self.MessageList)

    def run(self):
        print(self._nextNodes)
        self._eventBus.emit("workflow", self._id)
        self._eventBus.emit("Message","info", self._id+":Executing")
        self.updateNext()
        self._eventBus.emit("Message","info", self._id+":Executed")

    def updateNext(self):
        self._next = self._nextNodes[0][1]