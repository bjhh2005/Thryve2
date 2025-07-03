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
        
        # 构建循环体内节点执行顺序图和next关系
        self.execution_graph = {}
        self.node_next_map = {}  # 存储每个节点的next配置
        
        # 首先初始化每个节点的next数组
        for block in self.blocks:
            node_id = block["id"]
            self.node_next_map[node_id] = []
            
        # 处理边和next关系
        for edge in self.edges:
            if not isinstance(edge, dict) or "sourceNodeID" not in edge or "targetNodeID" not in edge:
                raise LoopError(f"节点 {id} 的边配置无效: {edge}")
                
            source = edge["sourceNodeID"]
            target = edge["targetNodeID"]
            
            # 更新执行图
            if source not in self.execution_graph:
                self.execution_graph[source] = []
            self.execution_graph[source].append(target)
            
            # 更新next关系
            source_node = next((block for block in self.blocks if block["id"] == source), None)
            if source_node and source_node.get("type") == "condition":
                # 条件节点的next需要包含条件信息
                self.node_next_map[source].append((edge.get("sourcePortID", "next_id"), target))
            else:
                # 普通节点的next
                self.node_next_map[source].append(("next_id", target))
            
        # 初始化 MessageList
        self.MessageList = {}

    def _find_start_node(self) -> Optional[str]:
        """
        找到循环体中的起始节点（类型为start的节点）
        
        Returns:
            str: 起始节点ID，如果没找到则返回None
        """
        for block in self.blocks:
            if block.get("type") == "start":
                return block["id"]
        return None

    def _has_end_node(self) -> bool:
        """
        检查循环体中是否有结束节点
        
        Returns:
            bool: 是否存在end类型的节点
        """
        for block in self.blocks:
            if block.get("type") == "end":
                return True
        return False

    def execute_block_node(self, node_id: str, item: Any) -> Optional[str]:
        """
        执行单个循环体节点并返回下一个要执行的节点ID
        
        Args:
            node_id: 节点ID
            item: 当前迭代项
            
        Returns:
            str: 下一个要执行的节点ID，如果没有下一个节点则返回None
            
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
            node.run()
            # 让节点自己决定下一个节点
            return node.getNext()
            
        except Exception as e:
            raise LoopError(f"循环体内节点 {node_id} 执行失败: {str(e)}")

    def run(self):
        """
        执行循环节点
        
        Raises:
            LoopError: 当节点执行失败时
        """
        self._eventBus.emit("message", "info", self._id, "Loop start!")
        
        # 验证循环数组配置
        batch_for_type = self.batchFor.get("type") if self.batchFor else None
        if batch_for_type != "ref":
            raise LoopError(f"节点 {self._id} 的batchFor类型必须是ref")
            
        array_path = self.batchFor.get("content") if self.batchFor else None
        if not array_path or len(array_path) < 2:
            raise LoopError(f"节点 {self._id} 的数组引用路径无效")
            
        ref_node_id = array_path[0]
        if ref_node_id.endswith("_locals"):
            ref_node_id = ref_node_id[:-7]
        ref_node_property = array_path[1]
        
        try:
            # 获取循环数组
            array_data = self._eventBus.emit("askMessage", ref_node_id, ref_node_property)
            if array_data is None:
                raise LoopError(f"节点 {self._id} 无法获取循环数组")
            if not array_data:
                array_data = []
                
            # 查找start节点
            start_node_id = self._find_start_node()
            if not start_node_id:
                raise LoopError(f"节点 {self._id} 的循环体中缺少Start节点")
                
            # 检查是否有end节点
            if not self._has_end_node():
                raise LoopError(f"节点 {self._id} 的循环体中缺少End节点")
                
            # 执行循环
            for item in array_data:
                # 每次循环开始时先清理旧的节点实例
                for block in self.blocks:
                    self._eventBus.emit("cleanupNode", block["id"])
                
                # 重新初始化所有节点
                self.block_nodes = {}
                for block in self.blocks:
                    node_id = block["id"]
                    try:
                        # 创建节点时添加next配置
                        block_with_next = {
                            "id": node_id,
                            "type": block["type"],
                            "data": block.get("data", {}),
                            "next": self.node_next_map[node_id]
                        }
                        node = self._eventBus.emit("createNode", block_with_next)
                        if not node:
                            raise LoopError(f"创建循环体节点 {node_id} 失败")
                        node._is_loop_internal = True
                        self.block_nodes[node_id] = node
                    except Exception as e:
                        raise LoopError(f"初始化循环体节点 {node_id} 失败: {str(e)}")
 
                current_node_id = start_node_id
                last_node_type = None
                
                # 执行循环体内的工作流
                while current_node_id is not None:
                    node = self.block_nodes[current_node_id]
                    last_node_type = node._type
                    
                    # 执行当前节点并获取下一个节点
                    current_node_id = self.execute_block_node(current_node_id, item)
                    
                    # 如果条件节点返回None（条件不满足），直接跳到下一个循环项
                    if current_node_id is None and last_node_type == "condition":
                        break
                
                # 只有当不是因为条件不满足而中断时，才检查是否正确结束于end节点
                if current_node_id is None and last_node_type != "condition" and last_node_type != "end":
                    raise LoopError(f"节点 {self._id} 的循环体没有正确结束于End节点")
            
            # 更新下一个要执行的节点
            self.updateNext()
            self._eventBus.emit("message", "info", self._id, "Loop end!")
            return self.MessageList
            
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
        
            
        
        