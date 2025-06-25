import logging


from Factory import NodeFactory
from events import EventBus


class WorkflowEngine :
     
     def __init__(self, workflowData):
          nodes = None 

          self.bus = EventBus()
          self.factory = NodeFactory(nodes)
          self.startID = None
          self.backStack = []
          self.instance = {}

          self.bus.on("askMessage", self.askMessage)
          self.bus.on("putStack", self.putStack)

          pass

     def run(self):
          
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
     


     def askMessage(self, nodeId, paramName):
          return self.instance[nodeId].getMessage(paramName)

     def putStack(self, nodeID):
          self.backStack.append(nodeID)
     
     def popStack(self):
          if len(self.backStack) is 0:
               return None
          else:
               return self.backStack.pop()
          

               