from .MessageNode import MessageNode

class Start(MessageNode):

    def __init__(self,id, type, nextNodes, eventBus, data):
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)
        property = data["outputs"]["properties"]
        self.MessageList = {}
        for propName,propInfo in property.item():
            prop_type = propInfo.get("type", '')
            if prop_type == 'object':
                self.MessageList[propName] = {}
            elif prop_type == "array":
                self.MessageList[propName] = []
            else:
                self.MessageList[propName] = propInfo.get('default', None)
    def run(self):
        self.updateNext()

    def updateNext(self):
        self._next = None
        # self._nextNodes[]