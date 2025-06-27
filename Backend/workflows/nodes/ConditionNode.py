from enum import Enum
from typing import Dict, Optional, Any
from .Node import Node

class Op(Enum):
    EQ = "eq"           # 等于
    NEQ = "neq"         # 不等于
    GT = "gt"           # 大于
    GTE = "gte"         # 大于等于
    LT = "lt"           # 小于
    LTE = "lte"         # 小于等于
    IN = "in"           # 包含
    NIN = "nin"         # 不包含
    CONTAINS = "contains" # 字符串包含
    NOT_CONTAINS = "not_contains" # 字符串不包含
    IS_EMPTY = "is_empty" # 为空
    IS_NOT_EMPTY = "is_not_empty" # 不为空
    IS_TRUE = "is_true" # 为真
    IS_FALSE = "is_false" # 为假

class ConditionNode(Node):
    def __init__(self, id, type, nextNodes, eventBus, data):
        """
        初始化条件节点
        
        Args:
            id (str): 节点ID
            type (str): 节点类型
            nextNodes (list): 下一个节点列表
            eventBus: 事件总线
            data (dict): 节点数据，包含conditions等信息
        """
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        # 存储条件分支信息，key为分支标识，value为条件表达式
        self.conditions = {
            condition["key"]: condition["value"] 
            for condition in data.get("conditions", [])
        }
        self.current_branch = None

    def _evaluate_condition(self, condition: dict) -> bool:
        """
        评估单个条件表达式
        
        Args:
            condition (dict): 条件表达式数据
        
        Returns:
            bool: 条件评估结果
        """
        if not condition:
            return False

        # 获取操作数和操作符
        left = condition.get("left", {})
        operator = condition.get("operator")
        right = condition.get("right", {})

        # 获取左操作数的值
        left_value = self._get_value(left)

        # 如果没有操作符，只判断左值的真假
        if not operator:
            return bool(left_value)

        right_value = self._get_value(right)

        # 根据操作符类型进行判断
        match operator:
            case Op.EQ.value:
                return left_value == right_value
            case Op.NEQ.value:
                return left_value != right_value
            case Op.GT.value:
                return left_value > right_value
            case Op.GTE.value:
                return left_value >= right_value
            case Op.LT.value:
                return left_value < right_value
            case Op.LTE.value:
                return left_value <= right_value
            case Op.IN.value:
                return left_value in right_value
            case Op.NIN.value:
                return left_value not in right_value
            case Op.CONTAINS.value:
                return str(right_value) in str(left_value)
            case Op.NOT_CONTAINS.value:
                return str(right_value) not in str(left_value)
            case Op.IS_EMPTY.value:
                return not bool(left_value)
            case Op.IS_NOT_EMPTY.value:
                return bool(left_value)
            case Op.IS_TRUE.value:
                return bool(left_value) is True
            case Op.IS_FALSE.value:
                return bool(left_value) is False
            case _:
                return False

    def _get_value(self, value_ref: Optional[dict]) -> Any:
        """
        获取操作数的实际值
        
        Args:
            value_ref (Optional[dict]): 值引用对象
        
        Returns:
            Any: 实际值
        """
        if not value_ref:
            return None
            
        # 如果是引用类型，从eventBus获取值
        if value_ref.get("type") == "ref":
            content = value_ref.get("content", [])
            if len(content) >= 2:
                node_id = content[0]
                param_name = content[1]
                return self._eventBus.emit("askMessage", node_id, param_name)
        
        # 如果是常量类型，直接返回内容
        return value_ref.get("content")

    def run(self):
        """
        执行条件节点
        根据条件判断结果选择执行分支
        """
        # print(f"执行条件节点: {self._id}")
        self._eventBus.emit("workflow", self._id)
        self._eventBus.emit("Message", self._id+":Executing")
        # 遍历所有条件分支
        for branch_key, condition in self.conditions.items():
            # 如果条件满足，选择该分支
            if self._evaluate_condition(condition):
                self.current_branch = branch_key
                print(f"条件分支 {branch_key} 满足条件")
                break
        
        # 更新下一个节点
        self.updateNext()
        self._eventBus.emit("Message", self._id+":Executed")
        return True

    def updateNext(self):
        """
        更新下一个节点
        根据当前选择的分支设置下一个节点
        """
        if self.current_branch is None:
            self._next = None
            return
            
        # 在nextNodes中查找对应分支的下一个节点
        for node in self._nextNodes:
            if node[0] == self.current_branch:
                self._next = node[1]
                print(f"下一个节点: {self._next}")
                return
        
        self._next = None
