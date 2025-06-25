class CleanExecutor:
    def __init__(self, pre_workflow_data):
        self.raw_workflow = pre_workflow_data
        self.nodes = self._clean_nodes()
        self.edges = self.raw_workflow.get('edges', [])
        self.nodes_with_next = self._add_next_to_nodes()
    
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
            # 查找所有以该节点为源节点的边
            for edge in self.edges:
                if edge['sourceNodeID'] == node['id']:
                    target_node = nodes_dict.get(edge['targetNodeID'])
                    if target_node:
                        node['next'].append(target_node['id'])
        
        return self.nodes

    def get_cleaned_workflow(self):
        """
        获取清洗后的工作流数据，只返回带next数组的节点列表
        """
        return self.nodes_with_next

def clean_workflow(pre_workflow_data):
    """
    处理工作流数据的入口函数
    """
    workflow_data = CleanExecutor(pre_workflow_data)
    return workflow_data.get_cleaned_workflow()