import logging

logger = logging.getLogger(__name__)

class NodeFactory:
    def __init__(self, nodes):
        # 将节点列表转换为以id为键的字典
        self.nodes = {node['id']: node for node in nodes}
    
    def create_node_instance(self, nodeId):
        if nodeId not in self.nodes:
            logger.error(f"找不到ID为{nodeId}的节点")
            return None
        return self.__create_node(self.nodes[nodeId]["type"], nodeId)

    def __create_node(self, type, nodeId):
        """
        根据节点类型创建节点。

        :param type: 字符串，表示节点的类型。
        :param nodeId: 节点的唯一标识符
        :return: 创建的节点对象。

        创建节点的过程根据传入的 `type` 参数来判断。
        """
        match type:
            # case "start":
            #     return StartNode(node_id, node_next_data, data)
            case _:
                return None
            
            
            