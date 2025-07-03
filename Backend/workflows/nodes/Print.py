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
        # self.input_value 直接保存 inputsValues.input
        if not isinstance(data, dict):
            raise PrintNodeError(f"节点 {id}: 数据格式错误",7)
        if "inputsValues" not in data or "input" not in data["inputsValues"]:
            self.input_value = None
        else:
            self.input_value = data["inputsValues"]["input"]
        self.output = None
        # ref类型的值会在运行时获取

    def run(self):
        """
        执行打印操作
        打印指定的消息，并更新节点状态
        """


        # 处理输入值
        input_config = self.input_value
        value = None
        if input_config is None:
            value = ""
        elif input_config["type"] == "constant":
            value = input_config.get("content", "")
        elif input_config["type"] == "ref":
            content = input_config.get("content", None)
            if not isinstance(content, list) or len(content) != 2:
                raise PrintNodeError(f"节点 {self._id}: 引用值格式错误",7)
            ref_node_id = content[0]
            if ref_node_id.endswith("_locals"):
                ref_node_id = ref_node_id[:-7]
            ref_property = content[1]
            value = self._eventBus.emit("askMessage", ref_node_id, ref_property)
            if value is None:
                raise PrintNodeError(f"节点 {self._id}: 无法获取引用节点 {ref_node_id} 的值",7)
        else:
            value = ""

        self.output = value

        # 检查输出值
        if not value:
            self._eventBus.emit("message", "warning", self._id, "input value is empty")
        self._eventBus.emit("nodes_output", self._id, str(value))

        # 更新下一个节点
        self.updateNext()        
        return True

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            raise PrintNodeError(f"节点 {self._id}: 缺少后续节点配置",7)
        self._next = self._nextNodes[0][1]
