from .MessageNode import MessageNode

class Start(MessageNode):

    def __init__(self,id, type, nextNodes, eventBus, data):
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)
        property = data["outputs"]["properties"]
        for prop_name,prop_info in property.item():
            
        self.MessageList[]
