from .Node import Node

class PrintNodeError(Exception):
    """Print节点执行时的异常"""
    pass

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
        self.output = None

        # 检查必要的配置
        if not isinstance(data, dict):
            raise PrintNodeError(f"节点 {id}: 数据格式错误",7)
            
        if "inputsValues" not in data:
            raise PrintNodeError(f'节点 {self._id}: 节点json形式出错',7)
        else:
            self.input_value = self.data['inputsValues']['input']
        # ref类型的值会在运行时获取

    def run(self):
        """
        执行打印操作
        打印指定的消息，并更新节点状态
        """
        self._eventBus.emit("workflow", self._id)
        

        # 处理引用类型的输入
        if self.input_value['type'] == "ref":
            content = self.input_value["content"]
            if not isinstance(content, list) or len(content) != 2:
                raise PrintNodeError(f"节点 {self._id}: 引用值格式错误",7)
                
            ref_node_id = content[0]
            ref_property = content[1]
            
            self.output = self._eventBus.emit("askMessage", ref_node_id, ref_property)
            if self.output is None:
                raise PrintNodeError(f"节点 {self._id}: 无法获取引用节点 {ref_node_id} 的值",7)
        elif self.input_value['type'] =='constant':
            self.output = self.input_value['content']
        

        # 检查输入值
        if len(self.output) == 0:
            self._eventBus.emit("message", "warning", self._id, "input value is empty")

        self._eventBus.emit("nodes_output", self._id, str(self.output))
        
        # 更新下一个节点
        self.updateNext()        
        return True

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            raise PrintNodeError(f"节点 {self._id}: 缺少后续节点配置",7)
        self._next = self._nextNodes[0][1]
