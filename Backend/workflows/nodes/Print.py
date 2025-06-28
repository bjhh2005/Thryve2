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
        
        # 检查必要的配置
        if not isinstance(data, dict):
            raise PrintNodeError(f"节点 {id}: 数据格式错误",7)
            
        if "inputsValues" not in data:
            raise PrintNodeError(f"节点 {id}: 缺少inputsValues配置",7)
            
        if "input" not in data["inputsValues"]:
            raise PrintNodeError(f"节点 {id}: 缺少input配置",7)
            
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
<<<<<<< Updated upstream
        
        # 处理引用类型的输入
        if self.data["inputsValues"]["input"]["type"] == "ref":
            content = self.data["inputsValues"]["input"]["content"]
            if not isinstance(content, list) or len(content) != 2:
                raise PrintNodeError(f"节点 {self._id}: 引用值格式错误",7)
                
            ref_node_id = content[0]
            ref_property = content[1]
            
            self.input_value = self._eventBus.emit("askMessage", ref_node_id, ref_property)
            if self.input_value is None:
                raise PrintNodeError(f"节点 {self._id}: 无法获取引用节点 {ref_node_id} 的值",7)
=======
        self._eventBus.emit("message","info",self._id+":executing")
        try:
            # 如果是引用类型，需要从之前的节点获取值
            if "inputsValues" in self.data and "input" in self.data["inputsValues"]:
                input_config = self.data["inputsValues"]["input"]
                if input_config["type"] == "ref":
                    # 从引用的节点获取值
                    ref_node_id = input_config["content"][0]
                    ref_property = input_config["content"][1]
                    
                    self.input_value = self._eventBus.emit("askMessage", ref_node_id, ref_property)

            # 打印消息

            self._eventBus.emit("nodes_output",str(self.input_value))
            
            # 更新下一个节点
            self.updateNext()
            
            return {
                "status": "success",
                "message": str(self.input_value)
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
>>>>>>> Stashed changes

        # 检查输入值
        if self.input_value is None:
            self._eventBus.emit("message", "warning", self._id, "输入值为空")
        print(self.input_value)
        self._eventBus.emit("nodes_output", self._id, str(self.input_value))
        
        # 更新下一个节点
        self.updateNext()        
    def updateNext(self):
<<<<<<< Updated upstream
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            raise PrintNodeError(f"节点 {self._id}: 缺少后续节点配置",7)
        self._next = self._nextNodes[0][1]
=======
        self._eventBus.emit("message","info",self._id+": executed")
        self._next = self._nextNodes[0][1]
>>>>>>> Stashed changes
