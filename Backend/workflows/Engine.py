import logging
from typing import Optional, TYPE_CHECKING
import threading
from .Factory import NodeFactory
from .events import EventBus

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .WorkflowManager import WorkflowManager

class WorkflowEngine:
    
    def __init__(self, workflowData, socketio_instance, breakpoints=None):
        """
        构造函数，支持断点调试功能和多工作流支持。
        """
        self.socketio = socketio_instance
        self.bus = EventBus()
        self.nodes = self._prepare_nodes(workflowData)
        self.factory = NodeFactory(self.nodes, self.bus)
        self.backStack = []
        self.instance = {}
        
        # 多工作流支持相关属性
        self.global_bus: Optional[EventBus] = None  # 全局事件总线，由WorkflowManager注入
        self.workflow_id: Optional[str] = None  # 当前工作流ID，由WorkflowManager注入
        self.workflow_manager: Optional['WorkflowManager'] = None  # 工作流管理器引用，由WorkflowManager注入
        
        # 调试相关的核心状态属性
        self.is_paused = False                    # 暂停状态标志
        self.is_terminated = False                # 终止状态标志
        self.step_mode = False                    # 单步执行模式
        self.pause_event = threading.Event()     # 用于暂停/继续的信号量
        self.pause_event.set()                   # 初始状态为"非暂停"
        self.current_node_id = self._findStartNode()
        self.breakpoints = set(breakpoints if breakpoints is not None else [])
        self.debug_mode = len(self.breakpoints) > 0  # 如果有断点则启用调试模式
        self.is_running = False                   # 运行状态标志

        # 注册内部事件监听器
        self.bus.on("askMessage", self.askMessage)
        self.bus.on("putStack", self.putStack)
        self.bus.on("createNode", self.createNode)
        self.bus.on("getNodeInfo", self.getNodeInfo)
        self.bus.on("cleanupNode", self.cleanupNode)
        self.bus.on("updateMessage", self.updateMessage)
        self.bus.on("get_global_bus", self.get_global_bus)
        self.bus.on("get_workflow_manager", self.get_workflow_manager)
        self.bus.on("nodes_output", self.nodes_output)
        self.bus.on("message", self.message)

    def _prepare_nodes(self, workflowData):
        """
        准备节点和边数据，与之前版本逻辑相同。
        """
        cleaned_nodes = {}
        for node in workflowData.get("nodes", []):
            cleaned_node = {key: value for key, value in node.items() if key != 'meta'}
            cleaned_nodes[node['id']] = cleaned_node
        
        edges = workflowData.get('edges', [])
        
        for node in cleaned_nodes.values():
            node['next'] = []
            if node.get('type') == 'condition':
                for edge in edges:
                    if edge.get('sourceNodeID') == node['id']:
                        target_node = cleaned_nodes.get(edge.get('targetNodeID'))
                        if target_node:
                            node['next'].append((edge.get('sourcePortID'), target_node['id']))
            else:
                for edge in edges:
                    if edge.get('sourceNodeID') == node['id']:
                        target_node = cleaned_nodes.get(edge.get('targetNodeID'))
                        if target_node:
                            node['next'].append(("next_id", target_node['id']))
        return cleaned_nodes

    def _findStartNode(self):
        """查找起始节点ID"""
        for nodeId, nodeData in self.nodes.items():
            if nodeData.get('type') == 'start':
                return nodeId
        return None
    
    # --- 断点调试功能的外部控制方法 ---
    def pause(self):
        """命令：暂停执行"""
        if not self.is_running:
            logger.warning("Cannot pause: workflow is not running")
            return False
        
        logger.info(f"Pausing execution at node {self.current_node_id}")
        self.is_paused = True
        self.pause_event.clear()  # 清除信号，下次 wait() 将会阻塞
        # 发送暂停事件
        self.bus.emit("execution_paused", {"nodeId": self.current_node_id, "reason": "Paused by user"})
        return True

    def resume(self):
        """命令：恢复执行"""
        if not self.is_paused:
            logger.warning("Cannot resume: workflow is not paused")
            return False
        
        logger.info(f"Resuming execution from node {self.current_node_id}")
        self.is_paused = False
        self.step_mode = False
        self.pause_event.set()  # 设置信号，释放 wait() 的阻塞
        # 发送恢复事件
        self.bus.emit("execution_resumed", {"nodeId": self.current_node_id, "reason": "Resumed by user"})
        return True

    def terminate(self):
        """命令：终止执行"""
        logger.info("Terminating execution...")
        self.is_terminated = True
        self.is_running = False
        self.is_paused = False
        # 必须先恢复执行，让循环得以继续并检测到终止信号
        if not self.pause_event.is_set():
            self.pause_event.set()
        # 发送终止事件
        self.bus.emit("execution_terminated", {"nodeId": self.current_node_id, "reason": "Terminated by user"})
        return True

    def step_over(self):
        """命令：单步执行（执行一步然后立即暂停）"""
        if not self.is_paused:
            logger.warning("Cannot step over: workflow is not paused")
            return False
        
        logger.info(f"Stepping over from node {self.current_node_id}")
        self.step_mode = True
        self.is_paused = False
        self.pause_event.set()  # 释放当前暂停状态，让执行继续
        # 发送单步执行事件
        self.bus.emit("execution_step_over", {"nodeId": self.current_node_id, "reason": "Step over by user"})
        return True

    def run(self):
        """
        标准运行方法，为了向后兼容而保留。
        如果有断点则使用调试模式，否则使用标准模式。
        """
        if self.debug_mode:
            return self.debug_run()
        else:
            return self._standard_run()

    def _standard_run(self):
        """
        标准运行模式，不支持断点调试。
        """
        curNodeID = self._findStartNode()
        if curNodeID is None:
            return False, "Missing Start node"
        
        if not any(node.get('type') == 'end' for node in self.nodes.values()):
            return False, "Missing End node"
        
        self.is_running = True
        last_node_type = None
        
        while curNodeID is not None:
            # 关键：让出CPU时间给网络服务，保持连接稳定
            self.socketio.sleep(0)

            try:
                # 1. 发送节点"处理中"状态
                self.bus.emit("node_status_change", {"nodeId": curNodeID, "status": "PROCESSING"})
                
                if curNodeID not in self.instance:
                    self.instance[curNodeID] = self.factory.create_node_instance(curNodeID)
                
                workNode = self.instance[curNodeID]
                last_node_type = self.nodes[curNodeID].get('type')
                
                # 执行节点并捕获返回值
                result_payload = workNode.run()
                
                # 2. 节点成功，将返回值作为 payload 发送
                self.bus.emit("node_status_change", {
                    "nodeId": curNodeID, 
                    "status": "SUCCEEDED",
                    "payload": result_payload if result_payload is not None else "Execution finished with no output."
                })

            except Exception as e:
                # 3. 节点失败，将错误信息作为 payload 发送
                error_payload = { "error": type(e).__name__, "details": str(e) }
                self.bus.emit("node_status_change", {
                    "nodeId": curNodeID, 
                    "status": "FAILED", 
                    "payload": error_payload
                })
                # 重新抛出异常，以终止整个工作流的执行
                raise e

            curNodeID = workNode.getNext()
            if curNodeID is None:
                curNodeID = self.popStack()

        self.is_running = False
        if last_node_type != 'end':
            return False, "Workflow did not end with End node"
        
        return True, "Workflow executed successfully"

    def debug_run(self):
        """
        调试运行模式，支持断点、暂停、单步执行等功能。
        """
        if self.current_node_id is None:
            return False, "Missing Start node"
        
        if not any(node.get('type') == 'end' for node in self.nodes.values()):
            return False, "Missing End node"
        
        self.is_running = True
        last_node_type = None
        
        logger.info(f"Starting debug execution with breakpoints: {list(self.breakpoints)}")
        
        while self.current_node_id is not None and not self.is_terminated:
            # 1. 检查是否需要暂停（断点或用户暂停）
            should_pause = False
            pause_reason = ""
            
            # 检查断点
            if self.current_node_id in self.breakpoints:
                should_pause = True
                pause_reason = "Breakpoint hit"
                logger.info(f"Breakpoint hit at node {self.current_node_id}")
            
            # 检查单步模式
            if self.step_mode:
                should_pause = True
                pause_reason = "Step mode"
                self.step_mode = False  # 重置单步模式
                logger.info(f"Step mode pause at node {self.current_node_id}")
            
            # 如果需要暂停，执行暂停逻辑
            if should_pause:
                self.is_paused = True
                self.pause_event.clear()  # 清除信号，准备进入等待状态
                self.bus.emit("execution_paused", {"nodeId": self.current_node_id, "reason": pause_reason})
                logger.info(f"Execution paused at node {self.current_node_id}: {pause_reason}")
            
            # 2. 等待继续信号（如果当前事件未设置，即暂停状态）
            if not self.pause_event.is_set():
                logger.info(f"Waiting for resume signal at node {self.current_node_id}")
                self.pause_event.wait()  # 阻塞等待，直到收到resume信号
                logger.info(f"Resume signal received at node {self.current_node_id}")
            
            # 3. 检查终止状态
            if self.is_terminated:
                self.bus.emit("execution_terminated", {"reason": "Terminated by user"})
                logger.info("Execution terminated by user")
                break
            
            # 4. 执行当前节点
            try:
                # 发送节点"处理中"状态
                self.bus.emit("node_status_change", {"nodeId": self.current_node_id, "status": "PROCESSING"})
                
                # 创建或获取节点实例
                if self.current_node_id not in self.instance:
                    self.instance[self.current_node_id] = self.factory.create_node_instance(self.current_node_id)
                
                workNode = self.instance[self.current_node_id]
                if workNode is None:
                    raise RuntimeError(f"Failed to create node instance for {self.current_node_id}")
                
                last_node_type = self.nodes[self.current_node_id].get('type')
                logger.info(f"Executing node {self.current_node_id} ({last_node_type})")
                
                # 执行节点
                result_payload = workNode.run()
                
                # 发送成功状态
                self.bus.emit("node_status_change", {
                    "nodeId": self.current_node_id, 
                    "status": "SUCCEEDED", 
                    "payload": result_payload if result_payload is not None else "Execution finished with no output."
                })
                
                logger.info(f"Node {self.current_node_id} executed successfully")
                
                # 5. 获取下一个节点
                next_node_id = workNode.getNext()
                if next_node_id is None:
                    next_node_id = self.popStack()
                
                self.current_node_id = next_node_id
                logger.info(f"Moving to next node: {self.current_node_id}")
            
            except Exception as e:
                # 节点执行失败
                error_payload = { "error": type(e).__name__, "details": str(e) }
                self.bus.emit("node_status_change", {
                    "nodeId": self.current_node_id, 
                    "status": "FAILED", 
                    "payload": error_payload
                })
                logger.error(f"Error executing node {self.current_node_id}: {e}")
                
                # 在调试模式下，遇到错误时暂停而不是终止
                self.is_paused = True
                self.pause_event.clear()
                self.bus.emit("execution_paused", {"nodeId": self.current_node_id, "reason": "Error occurred"})
                logger.info(f"Execution paused due to error at node {self.current_node_id}")
                
                # 不立即返回，而是等待用户决定如何处理
                continue
            
            # 6. 让出CPU时间
            self.socketio.sleep(0.01)

        # 执行完成
        self.is_running = False
        self.is_paused = False
        
        if self.is_terminated:
            return False, "Execution terminated by user"
        
        # 检查是否正常结束
        if last_node_type != 'end':
            return False, "Workflow did not end with End node"

        # 发送完成信号
        self.bus.emit("over", {"message": "Workflow finished.", "status": "success"})
        logger.info("Debug workflow finished successfully")
        return True, "Workflow executed successfully"

    def askMessage(self, nodeId, nodePort):
        return self.instance[nodeId].getMessage(nodePort)

    def putStack(self, nodeID):
        self.backStack.append(nodeID)

    def popStack(self):
        return self.backStack.pop() if self.backStack else None

    def createNode(self, nodeData):
        nodeId = nodeData["id"]
        if nodeId not in self.instance:
            self.nodes[nodeId] = nodeData
            self.instance[nodeId] = self.factory.create_node_instance(nodeId)
        return self.instance[nodeId]

    def getNodeInfo(self, nodeId):
        return self.nodes.get(nodeId, {})

    def cleanupNode(self, nodeId):
        if nodeId in self.instance:
            del self.instance[nodeId]

    def updateMessage(self, nodeId, nodePort, value):
        if nodeId in self.instance:
            self.instance[nodeId].setMessage(nodePort, value)

    def get_global_bus(self):
        """返回全局事件总线给调用节点使用"""
        return getattr(self, 'global_bus', None)
    
    def get_workflow_manager(self):
        """返回工作流管理器给调用节点使用"""
        return getattr(self, 'workflow_manager', None)
    
    def nodes_output(self, node_id, output_value):
        """处理节点输出事件"""
        logging.info(f"节点 {node_id} 输出: {output_value}")
        # 注意：不在这里直接发送WebSocket事件，避免与engineConnect的事件监听器冲突
        # 事件会通过app.py中的engineConnect函数统一处理和转发
    
    def message(self, level, node_id, message):
        """处理节点消息事件"""
        logging.log(getattr(logging, level.upper(), logging.INFO), 
                   f"节点 {node_id}: {message}")
        # 注意：不在这里直接发送WebSocket事件，避免与engineConnect的事件监听器冲突
        # 事件会通过app.py中的engineConnect函数统一处理和转发
    
    def cleanup_all_nodes(self):
        """清理所有节点实例，释放内存"""
        logging.info(f"清理工作流 {getattr(self, 'workflow_id', 'unknown')} 的所有节点实例")
        
        # 清理所有节点实例
        node_count = len(self.instance)
        for node_id in list(self.instance.keys()):
            try:
                node_instance = self.instance[node_id]
                # 如果节点有特殊的清理方法，调用它
                if hasattr(node_instance, 'cleanup'):
                    node_instance.cleanup()
                del self.instance[node_id]
            except Exception as e:
                logging.warning(f"清理节点 {node_id} 时出现警告: {str(e)}")
        
        # 清理事件总线的监听器
        if hasattr(self.bus, 'listeners'):
            self.bus.listeners.clear()
        
        # 清理堆栈
        self.backStack.clear()
        
        logging.info(f"已清理 {node_count} 个节点实例，内存已释放")
    
    def get_memory_usage_info(self):
        """获取当前内存使用信息"""
        return {
            "workflow_id": getattr(self, 'workflow_id', 'unknown'),
            "node_instances_count": len(self.instance),
            "instantiated_nodes": list(self.instance.keys()),
            "total_nodes_count": len(self.nodes),
            "stack_size": len(self.backStack)
        }