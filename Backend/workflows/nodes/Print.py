from .Node import Node

class Print(Node):
    def __init__(self, id, type, nextNodes, eventBus, data):
        """
        初始化打印节点
        :param id: 节点唯一标识符
        :param type: 节点类型
        :param nextNodes: 邻接节点信息
        :param eventBus: 事件总线
        :param data: 节点数据
        """
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.input_value = None
        if "inputsValues" in data and "input" in data["inputsValues"]:
            input_config = data["inputsValues"]["input"]
            if input_config["type"] == "constant":
                self.input_value = input_config["content"]
            # ref类型的值会在运行时获取

    def run(self):
        """
        执行打印操作
        打印指定的消息，并更新节点状态
        """
        self._eventBus.emit("workflow", self._id)
        # 如果是引用类型，需要从之前的节点获取值
        if "inputsValues" in self.data and "input" in self.data["inputsValues"]:
            input_config = self.data["inputsValues"]["input"]
            if input_config["type"] == "ref":
                # 从引用的节点获取值
                ref_node_id = input_config["content"][0]
                ref_property = input_config["content"][1]
                
                self.input_value = self._eventBus.emit("askMessage", ref_node_id, ref_property)

        self._eventBus.emit("nodes_output",self._id, str(self.input_value))
        
        # 更新下一个节点
        self.updateNext()
        
    def updateNext(self):
        self._next = self._nextNodes[0][1]