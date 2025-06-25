import logging


from Factory import NodeFactory
from events.EventBus import EventBus    


class WorkflowEngine :
     
     def __init__(self, workflowData):
          # 从workflowData中获取处理后的节点数据
          self.nodes = workflowData
          
          self.bus = EventBus()
          self.factory = NodeFactory(self.nodes)
          # 查找并设置起始节点ID
          self.startID = self._find_start_node()
          self.backStack = []
          self.instance = {}

          self.bus.on("askMessage", self.askMessage)
          self.bus.on("putStack", self.putStack)

     def _find_start_node(self):
          """
          在节点列表中查找类型为'start'的节点，并返回其ID
          """
          for node in self.nodes:
               if node.get('type') == 'start':
                    return node.get('id')
          return None

     def run(self):
          if self.startID is None:
               return {"status": "error", "message": "找不到起始节点", "results": "返回代码1"}
          
          curNodeID = self.startID
          while curNodeID is not None:
               
               if curNodeID not in self.instance:
                    self.instance[curNodeID] = self.factory.create_node_instance(curNodeID)
               
               workNode = self.instance[curNodeID]

               workNode.run()

               curNodeID = workNode.getNext()

               if curNodeID is None:
                    curNodeID = self.popStack()

          return {"status" : "success", "message" : "蓝图运行成功", "results" : "返回代码0"}
     
     def askMessage(self, nodeId, nodePort):
          return self.instance[nodeId].getMessage(nodePort)

     def putStack(self, nodeID):
          self.backStack.append(nodeID)
     
     def popStack(self):
          if len(self.backStack) == 0:
               return None
          else:
               return self.backStack.pop()
          

               