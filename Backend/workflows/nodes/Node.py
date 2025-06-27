from abc import ABC, abstractmethod
from typing import final

class Node(ABC):
    def __init__(self, id, type, nextNodes, eventBus):
        """
        初始化节点的基本属性。
        :param _id: 每个节点的唯一标识符，用于区分不同的节点。
        :param _type: 节点的类型，决定节点的行为和特性。
        :param _nextNodes: 存储文件的邻接节点信息
        :param _eventBus : 节点和
        :param _next : 下一个节点的信息
        """
        
        # 静态数据
        self._id = id
        self._type = type
        self._nextNodes = nextNodes
        self._eventBus = eventBus
        self._next = None
        # 标记是否为循环内部节点
        self._is_loop_internal = False

    @abstractmethod
    def run(self):
        """
        执行节点的操作。

        这是一个抽象方法，具体的节点操作将在子类中定义。
        每个节点的运行逻辑应该在这个方法中实现。

        节点运行的时候,需要有以下的考虑:
        result是什么
        更新next_data
        更新自己的数据
        更新自己的_in_handle _out_handle
        """
        pass
    
    @abstractmethod
    def updateNext(self):
        pass


    @final
    def getNext(self):
        '''
        :return 返回节点的下一个执行的节点 如果没有下一个 那么设为None
        '''
        return self._next