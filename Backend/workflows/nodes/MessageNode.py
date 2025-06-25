from .Node import Node
from abc import ABC

class MessageNode(Node, ABC):

    def __init__(self, id, type, nextNodes, eventBus, ):
        self.MessageList = {}
        super(MessageNode, self).__init__(id, type, nextNodes, eventBus)

    def getMessage(self, nodePort):
        return self.MessageList[nodePort]
    
    