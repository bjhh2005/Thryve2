import logging
from .Factory import NodeFactory
from .events import EventBus 

class WorkflowEngine:
    
    def __init__(self, workflowData, socketio_instance):
        """
        构造函数，接收工作流数据和 socketio 实例。
        """
        self.socketio = socketio_instance
        
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
                # 1. 发送节点“处理中”状态
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