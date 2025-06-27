from .Node import Node

class End(Node):
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

    def run(self):
        # 更新下一个节点
        self.updateNext()
        
    def updateNext(self):
        return None