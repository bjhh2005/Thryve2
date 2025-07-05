import logging
from typing import Optional, TYPE_CHECKING
from .Factory import NodeFactory
from .events import EventBus 

if TYPE_CHECKING:
    from .WorkflowManager import WorkflowManager

class WorkflowEngine:
    
    def __init__(self, workflowData, socketio_instance):
        """
        构造函数，接收工作流数据和 socketio 实例。
        """
        self.socketio = socketio_instance
        
        # 多工作流支持相关属性
        self.global_bus: Optional[EventBus] = None  # 全局事件总线，由WorkflowManager注入
        self.workflow_id: Optional[str] = None  # 当前工作流ID，由WorkflowManager注入
        self.workflow_manager: Optional['WorkflowManager'] = None  # 工作流管理器引用，由WorkflowManager注入
        
        # 1. 清洗节点数据，移除meta字段
        cleaned_nodes = {}
        for node in workflowData.get("nodes", []):
            cleaned_node = {key: value for key, value in node.items() if key != 'meta'}
            cleaned_nodes[node['id']] = cleaned_node
        
        # 2. 获取边数据
        edges = workflowData.get('edges', [])
        
        # 3. 为每个节点构建 next 数组
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

        self.nodes = cleaned_nodes
        self.bus = EventBus()
        self.factory = NodeFactory(cleaned_nodes, self.bus)
        self.backStack = []
        self.instance = {}

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

    def run(self):
        """
        执行工作流的主方法。
        """
        curNodeID = self._findStartNode()
        if curNodeID is None:
            return False, "Missing Start node"
        
        if not any(node.get('type') == 'end' for node in self.nodes.values()):
            return False, "Missing End node"
        
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
                
                # --- 核心修改：捕获 workNode.run() 的返回值 ---
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

        if last_node_type != 'end':
            return False, "Workflow did not end with End node"
        
        return True, "Workflow executed successfully"

    def askMessage(self, nodeId, nodePort):
        return self.instance[nodeId].getMessage(nodePort)

    def putStack(self, nodeID):
        self.backStack.append(nodeID)

    def popStack(self):
        return self.backStack.pop() if self.backStack else None
    
    def _findStartNode(self):
        for nodeId, nodeData in self.nodes.items():
            if nodeData.get('type') == 'start':
                return nodeId
        return None

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