from .Node import Node

class Print(Node):

    def __init__(self,id, type, nextNodes, eventBus, data):
        super(Node, self).__init__(id, type, nextNodes, eventBus)

        print(data)

        inputValue = data["inputValues"]["input"]
        
        if inputValue["type"] == "constant":
            inputValue = inputValue["content"]
        elif inputValue["type"] == "ref":
            inputValue = self.bus.emit("askMessage", inputValue["content"][0], inputValue["content"][1])
        else:
            inputValue = ""

        #后续需要修改print为输出到前端
        print(inputValue)
        

    def run(self):
        print(self._nextNodes)
        self.updateNext()

    def updateNext(self):
        self._next = self._nextNodes[0][1]