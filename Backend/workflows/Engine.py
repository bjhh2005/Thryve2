import logging
import sys


from .Factory import NodeFactory
from .events import EventBus    


class WorkflowEngine :
     
     def __init__(self, workflowData):
          
          # 1. 清洗节点数据，移除meta字段，直接创建字典
          cleaned_nodes = {}
          for node in workflowData["nodes"]:
               # 创建节点的副本并移除meta字段
               cleaned_node = {
                    key: value for key, value in node.items() 
                    if key != 'meta'
               }
               cleaned_nodes[node['id']] = cleaned_node
          
          # 2. 获取边数据
          edges = workflowData.get('edges', [])
          
          # 3. 为每个节点添加next数组
          for node in cleaned_nodes.values():
               node['next'] = []
               
               if node['type'] == 'condition':
                    # 条件节点需要特殊处理，因为条件节点可以有多个输出
                    # 查找所有以该节点为源节点的边
                    for edge in edges:
                         if edge['sourceNodeID'] == node['id']:
                              target_node = cleaned_nodes.get(edge['targetNodeID'])
                              node['next'].append((edge['sourcePortID'], target_node['id']))
               else:
                    # 普通节点处理
                    # 查找所有以该节点为源节点的边
                    for edge in edges:
                         if edge['sourceNodeID'] == node['id']:
                              target_node = cleaned_nodes.get(edge['targetNodeID'])
                              node['next'].append(("next_id", target_node['id']))

          # 从workflowData中获取处理后的节点数据
          self.nodes = cleaned_nodes
          self.bus = EventBus()
          self.factory = NodeFactory(cleaned_nodes, self.bus)
          self.backStack = []
          self.instance = {}

          self.bus.on("askMessage", self.askMessage)
          self.bus.on("putStack", self.putStack)
          self.bus.on("createNode", self.createNode)
          self.bus.on("getNodeInfo", self.getNodeInfo)
          self.bus.on("cleanupNode", self.cleanupNode)


    
     def run(self):
          """
          Run the workflow and return a tuple (success, message)
          """
          # Check start node
          curNodeID = self._findStartNode()
          if curNodeID is None:
               return False, "Missing Start node"
          
          # Check end node
          has_end_node = False
          for node in self.nodes.values():
               if node.get('type') == 'end':
                    has_end_node = True
                    break
          
          if not has_end_node:
               return False, "Missing End node"
          
          last_node_type = None  # Track the last executed node type
          
          while curNodeID != None:
               try:
                    self.bus.emit("workflow", curNodeID)
                                   
                    if curNodeID not in self.instance:
                         self.instance[curNodeID] = self.factory.create_node_instance(curNodeID)
                         if self.instance[curNodeID] is None:
                              raise Exception(f"Failed to instantiate node type: {self.nodes[curNodeID]['type']}", 1)
                         
                    workNode = self.instance[curNodeID]
                    last_node_type = self.nodes[curNodeID].get('type')  # Record current node type
                    
                    workNode.run()
                    curNodeID = workNode.getNext()
                    if curNodeID is None:
                         curNodeID = self.popStack()
               except UnicodeError as ue:
                    # 处理编码错误
                    node_type = self.nodes[curNodeID].get('type', 'unknown')
                    error_msg = f"编码错误在节点 {node_type} (ID: {curNodeID}): {str(ue)}"
                    logging.error(error_msg)
                    
                    # 尝试修复编码问题
                    try:
                         # 对于消息类节点，尝试修复其MessageList中的内容
                         if hasattr(workNode, 'MessageList') and isinstance(workNode.MessageList, dict):
                              for key, value in workNode.MessageList.items():
                                   if isinstance(value, str):
                                        # 尝试使用replace策略处理无法编码的字符
                                        workNode.MessageList[key] = value.encode('utf-8', errors='replace').decode('utf-8')
                         
                         # 继续执行
                         curNodeID = workNode.getNext()
                         if curNodeID is None:
                              curNodeID = self.popStack()
                    except Exception:
                         # 如果修复失败，则中断工作流
                         return False, error_msg
               except Exception as e:
                    # 处理其他异常
                    node_type = "unknown"
                    if curNodeID in self.nodes:
                         node_type = self.nodes[curNodeID].get('type', 'unknown')
                    
                    error_msg = f"节点 {node_type} (ID: {curNodeID}) 执行错误: {str(e)}"
                    logging.error(error_msg)
                    return False, error_msg
          
          # Check if workflow ended properly (last node is end node)
          if last_node_type != 'end':
               return False, "Workflow did not end with End node"
          
          return True, "Workflow executed successfully"


     def askMessage(self, nodeId, nodePort):
          try:
               message = self.instance[nodeId].getMessage(nodePort)
               
               # 如果是字符串，确保编码正确
               if isinstance(message, str):
                    try:
                         # 测试能否正确编码
                         message.encode('utf-8')
                    except UnicodeEncodeError:
                         # 如果编码失败，使用replace策略
                         message = message.encode('utf-8', errors='replace').decode('utf-8')
               
               return message
          except Exception as e:
               logging.error(f"Error in askMessage: {e}")
               return f"[ERROR: {str(e)}]"


     def putStack(self, nodeID):
          self.backStack.append(nodeID)
     

     def popStack(self):
          if len(self.backStack) == 0:
               return None
          else:
               return self.backStack.pop()
     
     
     def _findStartNode(self):
          """
          Find the node with type 'start' in the node list and return its ID
          """
          for nodeId, nodeData in self.nodes.items():
               if nodeData.get('type') == 'start':
                    return nodeId
          return None

     def createNode(self, nodeData):
          """Create a node instance"""
          nodeId = nodeData["id"]
          if nodeId not in self.instance:
               self.nodes[nodeId] = nodeData
               self.instance[nodeId] = self.factory.create_node_instance(nodeId)
          return self.instance[nodeId]

     def getNodeInfo(self, nodeId):
          """Get node information"""
          return self.nodes.get(nodeId, {})

     def cleanupNode(self, nodeId):
          """清理节点实例"""
          if nodeId in self.instance:
               del self.instance[nodeId]

               