from .Node import Node

class RelocationNodeError(Exception):
    """Relocation节点执行时的异常"""
    pass

class Relocation(Node):
    def __init__(self, id, type, nextNodes, eventBus, data):
        """
        初始化重定位节点
        :param id: 节点唯一标识符
        :param type: 节点类型
        :param nextNodes: 邻接节点信息
        :param eventBus: 事件总线
        :param data: 节点数据
        """
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        
        if not isinstance(data, dict):
            raise RelocationNodeError(f"节点 {id}: 数据格式错误", 7)
            
        if "inputsValues" not in data:
            raise RelocationNodeError(f"节点 {id}: 缺少输入值配置", 7)
            
        inputs = data["inputsValues"]
        if "sourceVariable" not in inputs or "targetVariable" not in inputs:
            raise RelocationNodeError(f"节点 {id}: 缺少源变量或目标变量配置", 7)
            
        self.source_variable = inputs["sourceVariable"]
        self.target_variable = inputs["targetVariable"]

    def run(self):
        """
        执行重定位操作
        将sourceVariable的值替换为targetVariable的值
        """
        # 获取源变量值
        source_value = None
        if self.source_variable["type"] == "ref":
            content = self.source_variable.get("content", None)
            if not isinstance(content, list) or len(content) != 2:
                raise RelocationNodeError(f"节点 {self._id}: 源变量引用格式错误", 7)
            source_node_id = content[0]
            if source_node_id.endswith("_locals"):
                source_node_id = source_node_id[:-7]
            source_property = content[1]
            source_value = self._eventBus.emit("askMessage", source_node_id, source_property)
            if source_value is None:
                raise RelocationNodeError(f"节点 {self._id}: 无法获取源节点 {source_node_id} 的值", 7)
        elif self.source_variable["type"] == "constant":
            raise RelocationNodeError(f"节点 {self._id}: 源变量类型不应该为常量", 7)

        # 获取目标变量值
        target_value = None
        if self.target_variable["type"] == "ref":
            content = self.target_variable.get("content", None)
            if not isinstance(content, list) or len(content) != 2:
                raise RelocationNodeError(f"节点 {self._id}: 目标变量引用格式错误", 7)
            target_node_id = content[0]
            if target_node_id.endswith("_locals"):
                target_node_id = target_node_id[:-7]
            target_property = content[1]
            target_value = self._eventBus.emit("askMessage", target_node_id, target_property)
            if target_value is None:
                raise RelocationNodeError(f"节点 {self._id}: 无法获取目标节点 {target_node_id} 的值", 7)
        elif self.target_variable["type"] == "constant":
            target_value = self.target_variable.get("content", None)

        # 执行值替换
        if source_value is not None and target_value is not None:
            # 通知事件总线更新源变量的值
            self._eventBus.emit("updateMessage", source_node_id, source_property, target_value)
            self._eventBus.emit("message", "info", self._id, f"已将 \"{source_node_id}.{source_property}\"  的值更新为 \"{target_value}\"  ")
        else:
            self._eventBus.emit("message", "warning", self._id, "源变量或目标变量值为空")

        # 更新下一个节点
        self.updateNext()
        return True

    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            raise RelocationNodeError(f"节点 {self._id}: 缺少后续节点配置", 7)
        self._next = self._nextNodes[0][1]
