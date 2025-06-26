from .MessageNode import MessageNode
from ..Factory import NodeFactory

class Loop(MessageNode):
    def __init__(self, id, type, nextNodes, eventBus, data):
        super().__init__(id, type, nextNodes, eventBus)
        
        # 获取循环变量配置
        self.batchFor = data.get("batchFor", {})
        self.blocks = data.get("blocks", [])
        self.edges = data.get("edges", [])
        
        # 存储循环体内节点实例
        self.block_nodes = {}
        
        # 构建循环体内节点执行顺序图
        self.execution_graph = {}
        for edge in self.edges:
            source = edge["sourceNodeID"]
            target = edge["targetNodeID"]
            if source not in self.execution_graph:
                self.execution_graph[source] = []
            self.execution_graph[source].append(target)
            
        # 初始化 MessageList
        self.MessageList = {}

    def execute_block_node(self, node_id, item):
        """执行单个循环体节点"""
        node = self.block_nodes.get(node_id)
        if not node:
            return None
            
        # 更新当前迭代项到 MessageList
        self.MessageList["item"] = item
            
        # 执行节点
        result = node.run()
        
        # 获取下一个要执行的节点
        next_nodes = self.execution_graph.get(node_id, [])
        
        # 递归执行后续节点
        for next_node in next_nodes:
            self.execute_block_node(next_node, item)
            
        return result

    def find_start_nodes(self):
        """找到循环体中的起始节点（没有入边的节点）"""
        all_nodes = set(node["id"] for node in self.blocks)
        target_nodes = set()
        for edge in self.edges:
            target_nodes.add(edge["targetNodeID"])
        return list(all_nodes - target_nodes)

    def run(self):
        # 获取循环数组
        if self.batchFor["type"] != "ref":
            return None
            
        array_path = self.batchFor["content"]
        if not array_path or len(array_path) < 2:
            return None
            
        ref_node_id = array_path[0]
        ref_node_property = array_path[1]
        # 通过事件总线的 askMessage 方法获取源节点的输出
        array_data = self._eventBus.emit("askMessage", ref_node_id, ref_node_property)
        if not array_data:
            return None
            
        # 初始化循环体节点
        factory = NodeFactory({}, self._eventBus)  # 创建一个新的工厂实例
        for block in self.blocks:
            node_id = block["id"]
            node_type = block["type"]
            node_data = block.get("data", {})
            
            # 使用工厂创建节点实例
            self.block_nodes[node_id] = factory.__create_node(
                node_id,
                node_type,
                [],  # 循环体内节点的连接在内部处理
                self._eventBus,
                node_data
            )
        
        # 获取起始节点
        start_nodes = self.find_start_nodes()
        
        # 执行循环
        for item in array_data:
            # 从每个起始节点开始执行
            for start_node in start_nodes:
                self.execute_block_node(start_node, item)
        
        # 更新下一个要执行的节点
        self.updateNext()

    def updateNext(self):
        """更新下一个要执行的节点"""
        if self._nextNodes and len(self._nextNodes) > 0:
            self._next = self._nextNodes[0][1]