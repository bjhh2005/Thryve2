import logging

from .nodes import Start, FileInput, ConditionNode, Print, Loop, End, TextProcessor, CSV, JSON, PdfProcessor, FolderInput


logger = logging.getLogger(__name__)

class NodeFactory:
    def __init__(self, nodes, bus):
        # 将节点列表转换为以id为键的字典
        self.nodes = nodes
        self.bus = bus
    
    def create_node_instance(self, nodeId):
        return self.__create_node(nodeId, self.nodes[nodeId]["type"], self.nodes[nodeId]["next"], self.bus)

    def __create_node(self, nodeId, type, nextNodes, bus):
        """
        根据节点类型创建节点。

        :param type: 字符串，表示节点的类型。
        :param nodeId: 节点的唯一标识符
        :return: 创建的节点对象。

        创建节点的过程根据传入的 `type` 参数来判断。
        """
        match type:
            case "start":
                return Start(nodeId, nodeId, nextNodes, bus, self.nodes[nodeId]["data"])
            case "condition":
                 return ConditionNode(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case "print":
                return Print(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case "loop":
                return Loop(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case "file-input":
                return FileInput(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case "folder-input":
                return FolderInput(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case "text_processor":
                return TextProcessor(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case "pdf-processor":
                return PdfProcessor(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case "csv-processor":
                return CSV.CSVProcessor(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case "json-processor":
                return JSON.JSONProcessor(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case "end":
                return End(nodeId, type, nextNodes, bus, self.nodes[nodeId]["data"])
            case _:
                return None
            
            
            