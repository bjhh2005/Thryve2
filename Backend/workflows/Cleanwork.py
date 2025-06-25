class CleanExecutor:
    def __init__(self, pre_workflow_data):
        self.raw_workflow = pre_workflow_data
        self.nodes = self._clean_nodes()
        self.edges = self.raw_workflow.get('edges', [])
        self.nodes_with_next = self._add_next_to_nodes()
        self.nodes_with_data = self._data_process()
    
    def _clean_nodes(self):
        """
        清洗节点数据，移除meta字段
        """
        cleaned_nodes = []
        for node in self.raw_workflow.get('nodes', []):
            # 创建节点的副本并移除meta字段
            cleaned_node = {
                key: value for key, value in node.items() 
                if key != 'meta'
            }
            cleaned_nodes.append(cleaned_node)
        return cleaned_nodes
    
    def _add_next_to_nodes(self):
        """
        为每个节点添加next数组，表示指向的下一个节点
        """
        # 创建节点ID到节点的映射
        nodes_dict = {node['id']: node for node in self.nodes}
        
        # 为每个节点添加next数组
        for node in self.nodes:
            node['next'] = []
            if node['type']=='condition':
                """
                条件节点需要特殊处理，因为条件节点可以有多个输出
    
                """
                # 查找所有以该节点为源节点的边
                for edge in self.edges:
                    if edge['sourceNodeID'] == node['id']:
                        target_node = nodes_dict.get(edge['targetNodeID'])
                        if target_node:
                            node['next'].append({edge['sourcePortID']:target_node['id']})
                continue

            # 查找所有以该节点为源节点的边
            for edge in self.edges:
                if edge['sourceNodeID'] == node['id']:
                    target_node = nodes_dict.get(edge['targetNodeID'])
                    if target_node:
                        node['next'].append({"next_id":target_node['id']})
        
        return self.nodes

    def _data_process(self):
        """
        处理每个节点的data块，确保数据格式的一致性和完整性
        """
        for node in self.nodes_with_next:
            # 确保每个节点都有data字段
            if 'data' not in node:
                node['data'] = {}
            
            # 根据节点类型处理data块
            node_type = node.get('type', '')
            data = node['data']
            
            # 为不同类型的节点设置默认data结构
            if node_type == 'start':
                if 'outputs' not in data:
                    data['outputs'] = []
            elif node_type == 'end':
                if 'inputs' not in data:
                    data['inputs'] = []
            elif node_type in ['condition', 'loop', 'llm']:
                if 'inputs' not in data:
                    data['inputs'] = []
                if 'outputs' not in data:
                    data['outputs'] = []
                if 'properties' not in data:
                    data['properties'] = {}
            
            # 确保inputs和outputs是列表类型
            for field in ['inputs', 'outputs']:
                if field in data and not isinstance(data[field], list):
                    data[field] = []
            
            # 确保properties是字典类型
            if 'properties' in data and not isinstance(data['properties'], dict):
                data['properties'] = {}
        
        return self.nodes_with_next

    def get_cleaned_workflow(self):
        """
        获取清洗后的工作流数据，只返回带next数组的节点列表：

        [
    {
        "id": "node1",
        "type": "start",
        "data": {...},
        "next": {"next_id":"node2"}  # 指向的下一个节点ID
    }
    

    ...
]


特例：condition节点需要特殊处理，因为条件节点可以有多个输出

    条件节点需要特殊处理，因为条件节点可以有多个输出
            {
    "id": "condition_1",
    "type": "condition",
    "data": {
        # 条件节点的其他数据
    },
    "next": {
        "sourcePortId1": "node_id1",   
        "sourcePortId2": "node_id2"  
    }
}
              
        """
        print(self.nodes_with_data)
        return self.nodes_with_data

def clean_workflow(pre_workflow_data):
    """
    处理工作流数据的入口函数
    """
    workflow_data = CleanExecutor(pre_workflow_data)
    return workflow_data.get_cleaned_workflow()