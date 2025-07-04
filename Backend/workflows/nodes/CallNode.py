import logging
from .Node import Node

class CallNodeError(Exception):
    """调用节点执行时的异常"""
    pass

class CallNode(Node):
    """
    调用节点，用于主工作流调用子工作流
    """
    
    def __init__(self, id, type, nextNodes, eventBus, data):
        super().__init__(id, type, nextNodes, eventBus)
        self.data = data
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # 验证数据格式
        if not isinstance(data, dict):
            raise CallNodeError(f"节点 {id}: 数据格式错误")
        
        # 获取子工作流ID配置
        inputs_values = data.get("inputsValues", {})
        self.subworkflow_id_config = inputs_values.get("subworkflow_id")
        self.input_data_config = inputs_values.get("input_data")
        
        # 注册监听子工作流返回事件
        self._eventBus.on("subworkflow_return", self.handle_subworkflow_return)
        self.return_data = None
        self.is_waiting = False
        
        # 消息存储，兼容MessageNode接口
        self.MessageList = {"output": None}
    
    def run(self):
        """执行调用节点"""
        try:
            # 获取要调用的子工作流ID
            subworkflow_id = self._get_config_value(self.subworkflow_id_config)
            if not subworkflow_id:
                raise CallNodeError(f"节点 {self._id}: 未指定要调用的子工作流ID")
            
            # 获取传入参数
            input_data = self._get_config_value(self.input_data_config)
            
            self.logger.info(f"节点 {self._id} 准备调用子工作流: {subworkflow_id}")
            
            # 获取全局事件总线
            global_bus = self._get_global_bus()
            if not global_bus:
                raise CallNodeError(f"节点 {self._id}: 无法获取全局事件总线，请确保使用WorkflowManager执行工作流")
            
            # 重要：在调用子工作流之前设置等待状态
            self.is_waiting = True
            
            # 发送调用子工作流事件
            call_data = {
                "subworkflow_id": subworkflow_id,
                "caller_node_id": self._id,
                "input_data": input_data
            }
            
            # 使用全局事件总线发送调用请求（这是同步调用）
            global_bus.emit("call_subworkflow", call_data)
            
            # 调用完成后，等待状态应该已经被handle_subworkflow_return重置
            
            # 更新下一个节点
            self.updateNext()
            
            # 注意：输出消息将在handle_subworkflow_return中设置
            # 这里return_data还是None，真正的值会在子工作流完成后通过事件设置
            
            return self.return_data
            
        except Exception as e:
            self.logger.error(f"调用节点执行失败: {str(e)}")
            raise e
    
    def _get_config_value(self, config):
        """获取配置值（支持常量和引用）"""
        if config is None:
            return None
        
        if config.get("type") == "constant":
            return config.get("content", "")
        elif config.get("type") == "ref":
            content = config.get("content", None)
            if not isinstance(content, list) or len(content) != 2:
                raise CallNodeError(f"节点 {self._id}: 引用值格式错误")
            ref_node_id = content[0]
            if ref_node_id.endswith("_locals"):
                ref_node_id = ref_node_id[:-7]
            ref_property = content[1]
            value = self._eventBus.emit("askMessage", ref_node_id, ref_property)
            if value is None:
                raise CallNodeError(f"节点 {self._id}: 无法获取引用节点 {ref_node_id} 的值")
            return value
        else:
            return config.get("content", "")
    
    def _get_global_bus(self):
        """获取全局事件总线"""
        # 通过事件总线请求工作流管理器的全局事件总线
        try:
            # 发送特殊事件请求获取全局事件总线
            global_bus = self._eventBus.emit("get_global_bus")
            return global_bus
        except:
            return None
    
    def handle_subworkflow_return(self, event_data):
        """处理子工作流返回事件"""
        caller_node_id = event_data.get("caller_node_id")
        return_data = event_data.get("return_data")
        
        self.logger.info(f"节点 {self._id} 收到subworkflow_return事件: caller_node_id={caller_node_id}, is_waiting={self.is_waiting}")
        
        # 检查是否是当前节点的返回
        if caller_node_id == self._id and self.is_waiting:
            self.logger.info(f"节点 {self._id} 处理子工作流返回数据: {return_data}")
            self.return_data = return_data
            # 关键修复：更新消息存储，这样其他节点就能通过askMessage获取到值
            self.MessageList["output"] = return_data
            self.is_waiting = False
            self.logger.info(f"节点 {self._id} 状态更新完成: MessageList={self.MessageList}")
        else:
            self.logger.info(f"节点 {self._id} 忽略事件: caller_node_id不匹配或未在等待状态")
    
    def updateNext(self):
        """更新下一个节点"""
        if not self._nextNodes and not self._is_loop_internal:
            raise CallNodeError(f"节点 {self._id}: 缺少后续节点配置")
        if self._nextNodes:
            self._next = self._nextNodes[0][1]
    
    def cleanup(self):
        """清理节点资源"""
        self.logger.info(f"清理调用节点 {self._id} 的资源")
        
        # 清理返回数据
        self.return_data = None
        
        # 重置等待状态
        self.is_waiting = False
        
        # 清理配置引用
        self.subworkflow_id_config = None
        self.input_data_config = None
        
        # 如果有全局事件总线引用，清理它
        if hasattr(self, 'global_bus'):
            self.global_bus = None
        
        if hasattr(self, 'workflow_manager'):
            self.workflow_manager = None
    
    def getMessage(self, paramName):
        """获取节点消息（兼容MessageNode接口）"""
        return self.MessageList.get(paramName, None)
    
    def setMessage(self, paramName, value):
        """设置节点消息（兼容MessageNode接口）"""
        self.MessageList[paramName] = value 