import logging
from typing import Dict, List, Optional, Tuple, Any
from .Engine import WorkflowEngine
from .events import EventBus
from enum import Enum

class WorkflowType(Enum):
    MAIN = "main"
    SUB = "sub"

class WorkflowStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"

class WorkflowCallFrame:
    """工作流调用栈帧，记录调用信息"""
    def __init__(self, workflow_id: str, caller_node_id: str, return_data: Any = None):
        self.workflow_id = workflow_id
        self.caller_node_id = caller_node_id  # 调用者节点ID
        self.return_data = return_data  # 子工作流返回的数据

class WorkflowManager:
    """
    多工作流管理器，支持主工作流和子工作流的函数化调用
    """
    
    def __init__(self, socketio_instance):
        self.socketio = socketio_instance
        self.workflows: Dict[str, WorkflowEngine] = {}  # 所有工作流实例
        self.workflow_data: Dict[str, dict] = {}  # 工作流原始数据
        self.workflow_types: Dict[str, WorkflowType] = {}  # 工作流类型
        self.workflow_status: Dict[str, WorkflowStatus] = {}  # 工作流状态
        
        self.main_workflow_id: Optional[str] = None
        self.current_workflow_id: Optional[str] = None  # 当前执行的工作流
        self.call_stack: List[WorkflowCallFrame] = []  # 调用栈
        
        # 全局事件总线，用于工作流间通信
        self.global_bus = EventBus()
        self.setup_global_events()
        
        self.logger = logging.getLogger(__name__)
    
    def setup_global_events(self):
        """设置全局事件监听器"""
        # 监听子工作流调用请求
        self.global_bus.on("call_subworkflow", self.handle_subworkflow_call)
        # 监听工作流完成事件
        self.global_bus.on("workflow_completed", self.handle_workflow_completion)
        # 监听工作流失败事件
        self.global_bus.on("workflow_failed", self.handle_workflow_failure)
    
    def register_workflows(self, workflows_data: Dict[str, dict]):
        """
        注册多个工作流
        workflows_data格式：
        {
            "workflow_id": {
                "type": "main" | "sub",
                "name": "工作流名称",
                "nodes": [...],
                "edges": [...]
            }
        }
        """
        self.logger.info(f"注册 {len(workflows_data)} 个工作流")
        
        for workflow_id, data in workflows_data.items():
            workflow_type = WorkflowType(data.get("type", "sub"))
            
            # 验证主工作流唯一性
            if workflow_type == WorkflowType.MAIN:
                if self.main_workflow_id is not None:
                    raise ValueError(f"已存在主工作流 {self.main_workflow_id}，不能注册新的主工作流 {workflow_id}")
                self.main_workflow_id = workflow_id
            
            # 存储工作流信息
            self.workflow_data[workflow_id] = data
            self.workflow_types[workflow_id] = workflow_type
            self.workflow_status[workflow_id] = WorkflowStatus.PENDING
            
            self.logger.info(f"注册工作流: {workflow_id} (类型: {workflow_type.value})")
    
    def create_workflow_engine(self, workflow_id: str) -> WorkflowEngine:
        """创建工作流引擎实例"""
        if workflow_id not in self.workflow_data:
            raise ValueError(f"工作流 {workflow_id} 未注册")
        
        data = self.workflow_data[workflow_id]
        engine = WorkflowEngine(data, self.socketio)
        
        # 注入全局事件总线到工作流引擎
        engine.global_bus = self.global_bus
        engine.workflow_id = workflow_id
        engine.workflow_manager = self
        
        # 设置完整的事件监听器（类似于app.py中的engineConnect）
        # 转发节点状态变化事件，添加工作流ID
        def forward_node_status(event_data):
            event_data["workflowId"] = workflow_id
            self.socketio.emit('node_status_change', event_data, namespace='/workflow')
        
        # 转发节点消息事件
        def forward_message(event, nodeId, message):
            self.socketio.emit(event, {
                "data": nodeId, 
                "message": message, 
                "workflowId": workflow_id
            }, namespace='/workflow')
        
        # 转发节点输出事件
        def forward_nodes_output(nodeId, message):
            self.socketio.emit('nodes_output', {
                "data": nodeId, 
                "message": message, 
                "workflowId": workflow_id
            }, namespace='/workflow')
        
        # 注册事件监听器
        engine.bus.on('node_status_change', forward_node_status)
        engine.bus.on('message', forward_message)
        engine.bus.on('nodes_output', forward_nodes_output)
        
        return engine
    
    def run(self) -> Tuple[bool, str]:
        """执行工作流管理器"""
        if self.main_workflow_id is None:
            return False, "未找到主工作流"
        
        self.logger.info(f"开始执行主工作流: {self.main_workflow_id}")
        
        try:
            # 创建并启动主工作流
            return self.execute_workflow(self.main_workflow_id)
        except Exception as e:
            self.logger.error(f"工作流执行失败: {str(e)}")
            return False, f"工作流执行失败: {str(e)}"
    
    def execute_workflow(self, workflow_id: str) -> Tuple[bool, str]:
        """执行指定的工作流"""
        if workflow_id not in self.workflow_data:
            return False, f"工作流 {workflow_id} 不存在"
        
        # 创建工作流引擎（如果不存在）
        if workflow_id not in self.workflows:
            self.workflows[workflow_id] = self.create_workflow_engine(workflow_id)
        
        engine = self.workflows[workflow_id]
        self.current_workflow_id = workflow_id
        self.workflow_status[workflow_id] = WorkflowStatus.RUNNING
        
        self.logger.info(f"执行工作流: {workflow_id}")
        
        try:
            # 执行工作流
            success, message = engine.run()
            
            if success:
                self.workflow_status[workflow_id] = WorkflowStatus.COMPLETED
                self.global_bus.emit("workflow_completed", {
                    "workflow_id": workflow_id,
                    "message": message
                })
            else:
                self.workflow_status[workflow_id] = WorkflowStatus.FAILED
                self.global_bus.emit("workflow_failed", {
                    "workflow_id": workflow_id,
                    "message": message
                })
            
            return success, message
            
        except Exception as e:
            self.workflow_status[workflow_id] = WorkflowStatus.FAILED
            self.global_bus.emit("workflow_failed", {
                "workflow_id": workflow_id,
                "message": str(e)
            })
            raise e
    
    def handle_subworkflow_call(self, call_data):
        """
        处理子工作流调用请求
        call_data: {
            "subworkflow_id": "子工作流ID",
            "caller_node_id": "调用者节点ID",
            "input_data": "传入数据"
        }
        """
        subworkflow_id = call_data["subworkflow_id"]
        caller_node_id = call_data["caller_node_id"]
        input_data = call_data.get("input_data")
        
        self.logger.info(f"调用子工作流: {subworkflow_id} (调用者: {caller_node_id})")
        
        # 验证子工作流存在且为子工作流类型
        if subworkflow_id not in self.workflow_data:
            raise ValueError(f"子工作流 {subworkflow_id} 不存在")
        
        if self.workflow_types[subworkflow_id] != WorkflowType.SUB:
            raise ValueError(f"工作流 {subworkflow_id} 不是子工作流类型")
        
        # 验证当前工作流ID存在
        if self.current_workflow_id is None:
            raise RuntimeError("当前没有执行中的工作流")
        
        # 暂停当前工作流
        current_workflow = self.workflows[self.current_workflow_id]
        self.workflow_status[self.current_workflow_id] = WorkflowStatus.PAUSED
        
        # 将当前调用信息压入调用栈
        call_frame = WorkflowCallFrame(
            workflow_id=self.current_workflow_id,
            caller_node_id=caller_node_id
        )
        self.call_stack.append(call_frame)
        
        try:
            # 标记当前正在同步处理的子工作流
            self._current_subworkflow_call = subworkflow_id
            
            # 执行子工作流
            success, message = self.execute_workflow(subworkflow_id)
            self.logger.info(f"子工作流执行结果: success={success}, message={message}")
            
            if not success:
                # 子工作流执行失败，恢复主工作流并抛出异常
                self.restore_caller_workflow()
                raise RuntimeError(f"子工作流 {subworkflow_id} 执行失败: {message}")
            
            # 子工作流执行成功，返回结果给调用节点
            return_data = message  # 可以根据需要修改返回数据格式
            self.logger.info(f"准备恢复调用者工作流，return_data={return_data}")
            
            # 恢复调用者工作流
            self.restore_caller_workflow(return_data)
            
            return return_data
            
        finally:
            # 清理标记
            self._current_subworkflow_call = None
            # 无论成功还是失败，都清理子工作流的内存
            self.cleanup_subworkflow(subworkflow_id)
    
    def cleanup_subworkflow(self, workflow_id: str):
        """清理子工作流的内存占用"""
        # 只清理子工作流，不清理主工作流
        if self.workflow_types.get(workflow_id) == WorkflowType.SUB:
            if workflow_id in self.workflows:
                self.logger.info(f"开始清理子工作流 {workflow_id} 的内存")
                
                # 获取内存使用信息用于日志
                memory_info = self.workflows[workflow_id].get_memory_usage_info()
                self.logger.info(f"清理前内存信息: {memory_info}")
                
                # 清理所有节点实例
                self.workflows[workflow_id].cleanup_all_nodes()
                
                # 从工作流字典中移除引擎实例
                del self.workflows[workflow_id]
                
                self.logger.info(f"子工作流 {workflow_id} 内存清理完成")
        else:
            self.logger.warning(f"尝试清理非子工作流 {workflow_id}，操作被跳过")
    
    def get_memory_usage_summary(self) -> Dict[str, Any]:
        """获取所有工作流的内存使用摘要"""
        summary = {
            "total_workflows": len(self.workflows),
            "main_workflow": self.main_workflow_id,
            "active_workflows": [],
            "memory_details": {}
        }
        
        for workflow_id, engine in self.workflows.items():
            memory_info = engine.get_memory_usage_info()
            summary["memory_details"][workflow_id] = memory_info
            summary["active_workflows"].append({
                "id": workflow_id,
                "type": self.workflow_types[workflow_id].value,
                "status": self.workflow_status[workflow_id].value,
                "node_instances": memory_info["node_instances_count"]
            })
        
        return summary
    
    def force_cleanup_all_subworkflows(self):
        """强制清理所有子工作流的内存（调试用）"""
        subworkflows_to_cleanup = [
            wf_id for wf_id, wf_type in self.workflow_types.items() 
            if wf_type == WorkflowType.SUB and wf_id in self.workflows
        ]
        
        self.logger.info(f"强制清理 {len(subworkflows_to_cleanup)} 个子工作流")
        
        for workflow_id in subworkflows_to_cleanup:
            self.cleanup_subworkflow(workflow_id)
    
    def handle_workflow_completion(self, completion_data):
        """处理工作流完成事件"""
        completed_workflow_id = completion_data["workflow_id"]
        
        self.logger.info(f"工作流完成: {completed_workflow_id}")
        
        # 注意：子工作流完成的处理已经在handle_subworkflow_call中同步处理了
        # 这里只处理异步完成的情况（如果有的话）
        # 如果是在handle_subworkflow_call的同步调用中，不需要重复处理
        if (self.workflow_types[completed_workflow_id] == WorkflowType.SUB and 
            self.call_stack and 
            completed_workflow_id != getattr(self, '_current_subworkflow_call', None)):
            # 获取子工作流的返回数据（如果有）
            return_data = completion_data.get("return_data")
            
            # 恢复调用者工作流
            self.restore_caller_workflow(return_data)
    
    def handle_workflow_failure(self, failure_data):
        """处理工作流失败事件"""
        failed_workflow_id = failure_data["workflow_id"]
        
        self.logger.error(f"工作流失败: {failed_workflow_id}")
        
        # 如果失败的是子工作流，恢复调用者工作流
        if self.workflow_types[failed_workflow_id] == WorkflowType.SUB and self.call_stack:
            self.restore_caller_workflow()
            # 可以选择继续执行或者终止，这里选择终止
            raise RuntimeError(f"子工作流 {failed_workflow_id} 执行失败")
    
    def restore_caller_workflow(self, return_data=None):
        """恢复调用者工作流的执行"""
        if not self.call_stack:
            return
        
        # 从调用栈弹出调用帧
        call_frame = self.call_stack.pop()
        caller_workflow_id = call_frame.workflow_id
        caller_node_id = call_frame.caller_node_id
        
        self.logger.info(f"恢复工作流: {caller_workflow_id}")
        
        # 恢复当前工作流
        self.current_workflow_id = caller_workflow_id
        self.workflow_status[caller_workflow_id] = WorkflowStatus.RUNNING
        
        # 将返回数据传递给调用者节点
        if return_data is not None and caller_workflow_id in self.workflows:
            caller_workflow = self.workflows[caller_workflow_id]
            # 通过事件系统传递返回数据
            self.logger.info(f"发送subworkflow_return事件: caller_node_id={caller_node_id}, return_data={return_data}")
            caller_workflow.bus.emit("subworkflow_return", {
                "caller_node_id": caller_node_id,
                "return_data": return_data
            })
            self.logger.info(f"subworkflow_return事件发送完成")
        else:
            self.logger.warning(f"无法发送subworkflow_return事件: return_data={return_data}, caller_workflow_id={caller_workflow_id}, workflows={list(self.workflows.keys())}")
    
    def get_workflow_status(self, workflow_id: str) -> Optional[WorkflowStatus]:
        """获取工作流状态"""
        return self.workflow_status.get(workflow_id)
    
    def get_all_workflow_status(self) -> Dict[str, str]:
        """获取所有工作流状态"""
        return {wf_id: status.value for wf_id, status in self.workflow_status.items()}
    
    def pause_workflow(self, workflow_id: str):
        """暂停指定工作流"""
        if workflow_id in self.workflow_status:
            self.workflow_status[workflow_id] = WorkflowStatus.PAUSED
    
    def resume_workflow(self, workflow_id: str):
        """恢复指定工作流"""
        if workflow_id in self.workflow_status:
            self.workflow_status[workflow_id] = WorkflowStatus.RUNNING 