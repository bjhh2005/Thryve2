from .MessageNode import MessageNode
from typing import Dict, Any, List, Optional

class LoopError(Exception):
    """循环节点错误"""
    pass

class Loop(MessageNode):
    def __init__(self, id, type, nextNodes, eventBus, data: Dict[str, Any]):
        """
        初始化循环节点
        
        Args:
            id: 节点ID
            type: 节点类型
            nextNodes: 下一个节点列表
            eventBus: 事件总线
            data: 节点数据
            
        Raises:
            LoopError: 当初始化参数无效时
        """
        super().__init__(id, type, nextNodes, eventBus)
        
        # 验证并获取循环变量配置
        if not isinstance(data, dict):
            raise LoopError(f"节点 {id} 的data参数必须是字典类型")
            
        self.batchFor = data.get("batchFor")
        if not isinstance(self.batchFor, dict):
            raise LoopError(f"节点 {id} 缺少有效的batchFor配置")
        
        # 获取节点信息
        node_info = self._eventBus.emit("getNodeInfo", id)
        if not isinstance(node_info, dict):
            raise LoopError(f"节点 {id} 无法获取有效的节点信息")
            
        self.blocks = node_info.get("blocks", [])
        if not isinstance(self.blocks, list):
            raise LoopError(f"节点 {id} 的blocks配置无效")
            
        self.edges = node_info.get("edges", [])
        if not isinstance(self.edges, list):
            raise LoopError(f"节点 {id} 的edges配置无效")
        
        # 存储循环体内节点实例
        self.block_nodes = {}
        
        # 构建循环体内节点执行顺序图
        self.execution_graph = {}
        for edge in self.edges:
            if not isinstance(edge, dict) or "sourceNodeID" not in edge or "targetNodeID" not in edge:
                raise LoopError(f"节点 {id} 的边配置无效: {edge}")
                
            source = edge["sourceNodeID"]
            target = edge["targetNodeID"]
            if source not in self.execution_graph:
                self.execution_graph[source] = []
            self.execution_graph[source].append(target)
            
        # 初始化 MessageList
        self.MessageList = {}

    def execute_block_node(self, node_id: str, item: Any) -> Optional[bool]:
        """
        执行单个循环体节点
        
        Args:
            node_id: 节点ID
            item: 当前迭代项
            
        Raises:
            LoopError: 当节点执行失败时
        """
        node = self.block_nodes.get(node_id)
        if not node:
            raise LoopError(f"循环体内节点 {node_id} 不存在")
            
        # 更新当前迭代项到 MessageList
        self.MessageList["item"] = item
            
        try:
            # 执行节点
            
            result = node.run()
            
            # 获取下一个要执行的节点
            next_nodes = self.execution_graph.get(node_id, [])
            
            # 如果没有下一个节点，说明这是循环体内的最后一个节点
            if not next_nodes:
                return result
                

            # 递归执行后续节点
            for next_node in next_nodes:
                self.execute_block_node(next_node, item)
                
            return result
        except Exception as e:
            raise LoopError(f"循环体内节点 {node_id} 执行失败: {str(e)}")

    def find_start_nodes(self) -> List[str]:
        """
        找到循环体中的起始节点（没有入边的节点）
        
        Returns:
            List[str]: 起始节点ID列表
        """
        all_nodes = set(node["id"] for node in self.blocks)
        target_nodes = set()
        for edge in self.edges:
            target_nodes.add(edge["targetNodeID"])
        start_nodes = list(all_nodes - target_nodes)
        if not start_nodes:
            raise LoopError(f"节点 {self._id} 的循环体中没有起始节点")
        return start_nodes

    def run(self):
        """
        执行循环节点
        
        Raises:
            LoopError: 当节点执行失败时
        """
        # 验证循环数组配置
        batch_for_type = self.batchFor.get("type") if self.batchFor else None
        if batch_for_type != "ref":
            raise LoopError(f"节点 {self._id} 的batchFor类型必须是ref")
            
        array_path = self.batchFor.get("content") if self.batchFor else None
        if not array_path or len(array_path) < 2:
            raise LoopError(f"节点 {self._id} 的数组引用路径无效")
            
        ref_node_id = array_path[0]
        ref_node_property = array_path[1]
        
        try:
            # 获取循环数组
            array_data = self._eventBus.emit("askMessage", ref_node_id, ref_node_property)
            if array_data is None:  # 只有当真的获取失败时才报错
                raise LoopError(f"节点 {self._id} 无法获取循环数组")
            if not array_data:
                array_data = []  # 空数组是允许的
                
            # 构建循环体节点信息字典
            block_nodes = {}
            for block in self.blocks:
                if not isinstance(block, dict) or "id" not in block or "type" not in block:
                    raise LoopError(f"节点 {self._id} 的循环体节点配置无效: {block}")
                    
                node_id = block["id"]
                block_nodes[node_id] = {
                    "id": node_id,
                    "type": block["type"],
                    "data": block.get("data", {}),
                    "next": []
                }
                
            # 初始化循环体节点
            for block in self.blocks:
                node_id = block["id"]
                try:
                    self._eventBus.emit("putStack", node_id)
                    node = self._eventBus.emit("createNode", block_nodes[node_id])
                    if not node:
                        raise LoopError(f"创建循环体节点 {node_id} 失败")
                    # 标记这是一个循环内部节点
                    node._is_loop_internal = True

                    self.block_nodes[node_id] = node
                except Exception as e:
                    raise LoopError(f"初始化循环体节点 {node_id} 失败: {str(e)}")

            # 获取起始节点
            start_nodes = self.find_start_nodes()
            
            # 执行循环
            for item in array_data:
                for start_node in start_nodes:
                    self.execute_block_node(start_node, item)
            
            # 更新下一个要执行的节点
            self.updateNext()
            return self.getNext()
            
        except LoopError:
            raise
        except Exception as e:
            raise LoopError(f"节点 {self._id} 执行失败: {str(e)}")

    def updateNext(self):
        """
        更新下一个要执行的节点
        
        Raises:
            LoopError: 当无法确定下一个节点时
        """
        if not self._nextNodes and not self._is_loop_internal:
            raise LoopError(f"节点 {self._id} 没有可用的下一个节点")
            
        self._next = self._nextNodes[0][1]
        
            
        
        