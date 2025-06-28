from enum import Enum
from typing import Dict, Optional, Any, List
from .Node import Node

class ConditionError(Exception):
    """条件表达式错误"""
    pass

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

# 需要数值比较的操作符
NUMERIC_OPS = {Op.GT.value, Op.GTE.value, Op.LT.value, Op.LTE.value}
# 需要字符串操作的操作符
STRING_OPS = {Op.CONTAINS.value, Op.NOT_CONTAINS.value}
# 需要集合操作的操作符
COLLECTION_OPS = {Op.IN.value, Op.NIN.value}

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

    def _validate_operands(self, operator: str, left_value: Any, right_value: Any) -> None:
        """
        验证操作数的类型是否合法
        
        Args:
            operator: 操作符
            left_value: 左操作数
            right_value: 右操作数
            
        Raises:
            ConditionError: 当操作数类型不合法时
        """
        if operator in NUMERIC_OPS:
            if not (isinstance(left_value, (int, float)) and isinstance(right_value, (int, float))):
                raise ConditionError(f"数值比较操作符 '{operator}' 的操作数必须是数字类型")
                
        elif operator in STRING_OPS:
            if not (isinstance(left_value, str) and isinstance(right_value, str)):
                raise ConditionError(f"字符串操作符 '{operator}' 的操作数必须是字符串类型")
                
        elif operator in COLLECTION_OPS:
            try:
                iter(right_value)
            except TypeError:
                raise ConditionError(f"集合操作符 '{operator}' 的右操作数必须是可迭代对象")

    def _evaluate_condition(self, condition: dict) -> bool:
        """
        评估单个条件表达式
        
        Args:
            condition (dict): 条件表达式数据
        
        Returns:
            bool: 条件评估结果
            
        Raises:
            ConditionError: 当条件表达式非法时
        """
        if not condition:
            raise ConditionError("条件表达式不能为空")

        left = condition.get("left", {})
        operator = condition.get("operator")
        right = condition.get("right", {})

        # 获取左操作数的值
        left_value = self._get_value(left)
        
        # 验证左操作数
        if left_value is None and operator not in (Op.IS_EMPTY.value, Op.IS_NOT_EMPTY.value):
            raise ConditionError("缺少左操作数")

        # 如果没有操作符，只判断左值的真假
        if not operator:
            return bool(left_value)

        # 对于需要右操作数的操作符，验证右操作数
        if operator not in (Op.IS_EMPTY.value, Op.IS_NOT_EMPTY.value, Op.IS_TRUE.value, Op.IS_FALSE.value):
            right_value = self._get_value(right)
            if right_value is None:
                right_value = False
            
            # 验证操作数类型
            self._validate_operands(operator, left_value, right_value)
        else:
            right_value = None

        # 根据操作符类型进行判断
        try:
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
                    raise ConditionError(f"不支持的操作符: {operator}")
        except Exception as e:
            raise ConditionError(f"条件表达式执行错误: {str(e)}")

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
        try:
            # 遍历所有条件分支
            for branch_key, condition in self.conditions.items():
                # 如果条件满足，选择该分支
                if self._evaluate_condition(condition):
                    self.current_branch = branch_key
                    break
            
            # 更新下一个节点
            self.updateNext()
            return True
        except ConditionError as e:
            raise Exception(f"条件节点 {self._id} 执行错误: {str(e)}", 1)

    def updateNext(self):
        """
        更新下一个节点
        根据当前选择的分支设置下一个节点
        """
        if self.current_branch is None and not self._is_loop_internal:
            self._next = None
            self._eventBus.emit("message", "warning", self._id, "No branch selected")
            return
            
        # 在nextNodes中查找对应分支的下一个节点
        for node in self._nextNodes:
            if node[0] == self.current_branch:
                self._eventBus.emit("message", "info", self._id, "Choose branch: "+str(self.current_branch))
                self._next = node[1]
                return
        
        self._next = None
