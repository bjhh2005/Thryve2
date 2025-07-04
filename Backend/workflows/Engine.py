import logging
import threading
from .Factory import NodeFactory
from .events import EventBus

logger = logging.getLogger(__name__)

class WorkflowEngine:
    
    def __init__(self, workflowData, socketio_instance, breakpoints=None):
        """
        构造函数，增加对断点的支持。
        """
        self.socketio = socketio_instance
        self.bus = EventBus()
        self.nodes = self._prepare_nodes(workflowData)
        self.factory = NodeFactory(self.nodes, self.bus)
        self.backStack = []
        self.instance = {}
        
        # 新增：调试相关的核心状态属性
        self.pause_event = threading.Event()  # 用于暂停/继续的信号量
        self.pause_event.set()                # 初始状态为“非暂停”（即“允许继续”）
        self.is_terminated = False            # 终止状态标志
        self.current_node_id = self._findStartNode()
        self.breakpoints = set(breakpoints if breakpoints is not None else [])

        # 注册内部事件监听器
        self.bus.on("askMessage", self.askMessage)
        self.bus.on("putStack", self.putStack)
        self.bus.on("createNode", self.createNode)
        self.bus.on("getNodeInfo", self.getNodeInfo)
        self.bus.on("cleanupNode", self.cleanupNode)
        self.bus.on("updateMessage", self.updateMessage)

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
    
    # --- 新增：外部控制方法 ---
    def pause(self):
        """命令：暂停执行"""
        logger.debug(f"Pausing execution at node {self.current_node_id}")
        self.pause_event.clear() # 清除信号，下次 wait() 将会阻塞

    def resume(self):
        """命令：恢复执行"""
        logger.debug("Resuming execution...")
        self.pause_event.set() # 设置信号，释放 wait() 的阻塞

    def terminate(self):
        """命令：终止执行"""
        logger.debug("Terminating execution...")
        self.is_terminated = True
        # 必须先恢复执行，让循环得以继续并检测到终止信号
        if not self.pause_event.is_set():
            self.resume()

    def step_over(self):
        """命令：单步执行（执行一步然后立即暂停）"""
        logger.debug(f"Stepping over node {self.current_node_id}")
        self.resume() 
        self.socketio.sleep(0.05) # 给予一个极短的时间让一步执行完毕
        self.pause()
        # 执行完一步后，主动发送暂停事件，告知前端新的暂停位置
        self.bus.emit("execution_paused", {"nodeId": self.current_node_id, "reason": "Step completed"})

    # --- 新的执行方法，取代旧的 run ---
    def debug_run(self):
        """
        以可调试、可中断的模式运行工作流。
        """
        while self.current_node_id is not None:
            # 1. 检查终止信号
            if self.is_terminated:
                self.bus.emit("execution_terminated", {"reason": "Terminated by user."})
                logger.info("Execution terminated by user.")
                break

            # 2. 检查是否在断点处，如果是，则暂停
            if self.current_node_id in self.breakpoints:
                logger.info(f"Breakpoint hit at node {self.current_node_id}. Pausing.")
                self.pause()
                self.bus.emit("execution_paused", {"nodeId": self.current_node_id, "reason": "Breakpoint hit"})

            # 3. 等待“继续”信号，如果处于暂停状态，会在此阻塞
            self.pause_event.wait() 
            
            # 4. 在等待后再次检查终止信号
            if self.is_terminated:
                self.bus.emit("execution_terminated", {"reason": "Terminated by user."})
                logger.info("Execution terminated by user while paused.")
                break

            # 5. 执行单个节点逻辑
            try:
                self.bus.emit("node_status_change", {"nodeId": self.current_node_id, "status": "PROCESSING"})
                
                workNode = self.instance.get(self.current_node_id)
                if not workNode:
                    workNode = self.factory.create_node_instance(self.current_node_id)
                    self.instance[self.current_node_id] = workNode
                
                result_payload = workNode.run()
                
                self.bus.emit("node_status_change", {
                    "nodeId": self.current_node_id, 
                    "status": "SUCCEEDED", 
                    "payload": result_payload if result_payload is not None else "Execution finished with no output."
                })
            
            except Exception as e:
                error_payload = { "error": type(e).__name__, "details": str(e) }
                self.bus.emit("node_status_change", {
                    "nodeId": self.current_node_id, 
                    "status": "FAILED", 
                    "payload": error_payload
                })
                logger.error(f"Error executing node {self.current_node_id}: {e}")
                
                # 在调试模式下，遇到错误也应该暂停，而不是直接终止整个流程
                self.pause()
                self.bus.emit("execution_paused", {"nodeId": self.current_node_id, "reason": "Error occurred"})
            
            # 6. 获取下一个要执行的节点
            self.current_node_id = workNode.getNext()
            if self.current_node_id is None:
                self.current_node_id = self.popStack()
            
            # 7. 给予 I/O 一点喘息时间，保持连接稳定
            self.socketio.sleep(0.01)

        # 循环正常结束后，发送工作流完成信号
        if not self.is_terminated:
            self.bus.emit("over", {"message": "Workflow finished.", "status": "success"})
            logger.info("Workflow finished successfully.")

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