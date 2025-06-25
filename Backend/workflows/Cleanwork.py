class CleanExecutor:
    def __init__(self, pre_workflow_data):
        self.raw_workflow = pre_workflow_data
        self.nodes = self._clean_nodes()
        self.edges = self.raw_workflow.get('edges', [])
    
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
    
    def get_cleaned_workflow(self):
        """
        获取清洗后的工作流数据
        """
        return {
            'nodes': self.nodes,
            'edges': self.edges
        }

def clean_workflow(pre_workflow_data):
    """
    处理工作流数据的入口函数
    """
    workflow_data = CleanExecutor(pre_workflow_data)
    return workflow_data.get_cleaned_workflow()