# -*- coding: utf-8 -*-
"""
工作流JSON格式转换中间层
将前端发送的单一JSON格式转换为后端期望的多工作流格式
"""
import logging
from typing import Dict, List, Any, Tuple, Set

logger = logging.getLogger(__name__)

class WorkflowConverter:
    """工作流格式转换器"""
    
    def __init__(self):
        self.reset()
    
    def reset(self):
        """重置转换器状态"""
        self.main_workflow_nodes = []
        self.main_workflow_edges = []
        self.sub_workflows = {}
        self.func_start_titles = {}  # func-start节点ID到title的映射
        
    def convert_frontend_to_backend(self, frontend_json: Dict[str, Any]) -> Dict[str, Any]:
        """
        将前端JSON格式转换为后端多工作流格式
        
        Args:
            frontend_json: 前端发送的JSON数据
            
        Returns:
            后端期望的多工作流JSON格式
        """
        try:
            self.reset()
            
            nodes = frontend_json.get('nodes', [])
            edges = frontend_json.get('edges', [])
            
            logger.info(f"开始转换工作流，节点数: {len(nodes)}, 边数: {len(edges)}")
            
            # 第一步：识别所有func-start节点，创建子工作流映射
            self._identify_func_starts(nodes)
            
            # 第二步：分析节点连通性，分组到不同工作流
            self._group_nodes_by_workflow(nodes, edges)
            
            # 第三步：生成后端格式
            backend_json = self._generate_backend_format()
            
            logger.info(f"转换完成，生成 {len(backend_json['workflows'])} 个工作流")
            return backend_json
            
        except Exception as e:
            logger.error(f"工作流转换失败: {str(e)}")
            raise
    
    def _identify_func_starts(self, nodes: List[Dict[str, Any]]):
        """识别所有func-start节点并记录其title"""
        for node in nodes:
            if node.get('type') == 'func-start':
                node_id = node.get('id')
                title = node.get('data', {}).get('title', f'Function_{node_id}')
                self.func_start_titles[node_id] = title
                
                # 初始化子工作流
                self.sub_workflows[title] = {
                    'nodes': [],
                    'edges': [],
                    'func_start_id': node_id
                }
                
        logger.info(f"识别到 {len(self.func_start_titles)} 个函数: {list(self.func_start_titles.values())}")
    
    def _group_nodes_by_workflow(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
        """将节点按工作流分组"""
        
        # 构建节点连接图
        node_graph = self._build_node_graph(edges)
        
        # 找到每个func-start的连通组件
        for func_title, workflow_data in self.sub_workflows.items():
            func_start_id = workflow_data['func_start_id']
            connected_nodes = self._find_connected_component(func_start_id, node_graph)
            
            # 为子工作流收集节点和边
            for node in nodes:
                if node['id'] in connected_nodes:
                    converted_node = self._convert_node_for_subworkflow(node)
                    workflow_data['nodes'].append(converted_node)
            
            # 收集子工作流内部的边
            workflow_data['edges'] = self._filter_edges_for_workflow(edges, connected_nodes)
        
        # 收集主工作流的节点（start, end, call节点以及不属于任何子工作流的节点）
        sub_workflow_node_ids = set()
        for workflow_data in self.sub_workflows.values():
            for node in workflow_data['nodes']:
                sub_workflow_node_ids.add(node['id'])
        
        for node in nodes:
            if node['id'] not in sub_workflow_node_ids:
                if node.get('type') in ['start', 'end', 'call'] or not self._belongs_to_subworkflow(node['id'], node_graph):
                    self.main_workflow_nodes.append(node)
        
        # 收集主工作流的边
        main_workflow_node_ids = {node['id'] for node in self.main_workflow_nodes}
        self.main_workflow_edges = self._filter_edges_for_workflow(edges, main_workflow_node_ids)
    
    def _build_node_graph(self, edges: List[Dict[str, Any]]) -> Dict[str, Set[str]]:
        """构建节点连接图"""
        graph = {}
        for edge in edges:
            source = edge.get('sourceNodeID')
            target = edge.get('targetNodeID')
            
            if source and target:
                if source not in graph:
                    graph[source] = set()
                if target not in graph:
                    graph[target] = set()
                
                graph[source].add(target)
                graph[target].add(source)  # 无向图
        
        return graph
    
    def _find_connected_component(self, start_node: str, graph: Dict[str, Set[str]]) -> Set[str]:
        """使用DFS找到与start_node连通的所有节点"""
        visited = set()
        stack = [start_node]
        
        while stack:
            node = stack.pop()
            if node in visited:
                continue
                
            visited.add(node)
            
            # 添加所有邻接节点
            for neighbor in graph.get(node, set()):
                if neighbor not in visited:
                    stack.append(neighbor)
        
        return visited
    
    def _belongs_to_subworkflow(self, node_id: str, graph: Dict[str, Set[str]]) -> bool:
        """检查节点是否属于某个子工作流"""
        for func_start_id in self.func_start_titles.keys():
            connected_nodes = self._find_connected_component(func_start_id, graph)
            if node_id in connected_nodes:
                return True
        return False
    
    def _convert_node_for_subworkflow(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """转换节点用于子工作流（func-start -> start, func-end -> end）"""
        converted_node = node.copy()
        
        if node.get('type') == 'func-start':
            converted_node['type'] = 'start'
        elif node.get('type') == 'func-end':
            converted_node['type'] = 'end'
        
        return converted_node
    
    def _filter_edges_for_workflow(self, edges: List[Dict[str, Any]], node_ids: Set[str]) -> List[Dict[str, Any]]:
        """过滤出指定节点集合内部的边"""
        filtered_edges = []
        
        for edge in edges:
            source = edge.get('sourceNodeID')
            target = edge.get('targetNodeID')
            
            if source in node_ids and target in node_ids:
                filtered_edges.append({
                    'sourceNodeID': source,
                    'targetNodeID': target,
                    'sourcePortID': edge.get('sourcePortID', 'next_id'),
                    'targetPortID': edge.get('targetPortID', 'input')
                })
        
        return filtered_edges
    
    def _generate_backend_format(self) -> Dict[str, Any]:
        """生成后端期望的多工作流格式"""
        backend_format = {
            'workflows': {}
        }
        
        # 添加主工作流
        backend_format['workflows']['main_workflow'] = {
            'type': 'main',
            'name': '主工作流',
            'nodes': self._convert_nodes_to_backend_format(self.main_workflow_nodes),
            'edges': self.main_workflow_edges
        }
        
        # 添加子工作流
        for func_title, workflow_data in self.sub_workflows.items():
            # 生成工作流ID（将title转换为合适的ID格式）
            workflow_id = self._generate_workflow_id(func_title)
            
            backend_format['workflows'][workflow_id] = {
                'type': 'sub',
                'name': func_title,
                'nodes': self._convert_nodes_to_backend_format(workflow_data['nodes']),
                'edges': workflow_data['edges']
            }
        
        return backend_format
    
    def _convert_nodes_to_backend_format(self, nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """将节点转换为后端期望的格式"""
        converted_nodes = []
        
        for node in nodes:
            # 基本节点结构
            converted_node = {
                'id': node.get('id'),
                'type': node.get('type'),
                'data': {}
            }
            
            # 获取原始data
            original_data = node.get('data', {})
            
            # 复制所有data字段，确保不丢失任何重要信息
            for key, value in original_data.items():
                converted_node['data'][key] = value
            
            # 确保必要的字段存在
            if 'inputsValues' not in converted_node['data']:
                converted_node['data']['inputsValues'] = {}
            if 'outputsValues' not in converted_node['data']:
                converted_node['data']['outputsValues'] = {}
            
            converted_nodes.append(converted_node)
        
        return converted_nodes
    
    def _generate_workflow_id(self, title: str) -> str:
        """根据title生成工作流ID"""
        # 将title转换为合适的ID格式
        workflow_id = title.lower().replace(' ', '_').replace('-', '_')
        # 移除特殊字符，只保留字母数字和下划线
        import re
        workflow_id = re.sub(r'[^a-z0-9_]', '', workflow_id)
        
        # 确保ID不为空
        if not workflow_id:
            workflow_id = f'workflow_{hash(title) % 10000}'
        
        return workflow_id
    
    def validate_conversion(self, frontend_json: Dict[str, Any], backend_json: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """验证转换结果的正确性"""
        errors = []
        
        try:
            # 验证基本结构
            if 'workflows' not in backend_json:
                errors.append("后端格式缺少 'workflows' 字段")
                return False, errors
            
            workflows = backend_json['workflows']
            
            # 验证主工作流存在
            if 'main_workflow' not in workflows:
                errors.append("缺少主工作流 'main_workflow'")
            
            # 验证每个工作流的结构
            for workflow_id, workflow in workflows.items():
                if 'type' not in workflow:
                    errors.append(f"工作流 {workflow_id} 缺少 'type' 字段")
                
                if 'nodes' not in workflow:
                    errors.append(f"工作流 {workflow_id} 缺少 'nodes' 字段")
                
                if 'edges' not in workflow:
                    errors.append(f"工作流 {workflow_id} 缺少 'edges' 字段")
                
                # 验证子工作流有start和end节点
                if workflow.get('type') == 'sub':
                    node_types = [node.get('type') for node in workflow.get('nodes', [])]
                    if 'start' not in node_types:
                        errors.append(f"子工作流 {workflow_id} 缺少 start 节点")
                    if 'end' not in node_types:
                        errors.append(f"子工作流 {workflow_id} 缺少 end 节点")
            
            # 验证call节点的目标是否存在
            main_workflow = workflows.get('main_workflow', {})
            for node in main_workflow.get('nodes', []):
                if node.get('type') == 'call':
                    target_workflow = node.get('data', {}).get('inputsValues', {}).get('target_workflow', {}).get('content')
                    if target_workflow:
                        # 检查是否存在对应的子工作流
                        found = False
                        for workflow_id, workflow in workflows.items():
                            if workflow.get('type') == 'sub' and workflow.get('name') == target_workflow:
                                found = True
                                break
                        
                        if not found:
                            errors.append(f"Call节点目标工作流 '{target_workflow}' 不存在")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            errors.append(f"验证过程出错: {str(e)}")
            return False, errors


def convert_workflow_format(frontend_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    转换工作流格式的便捷函数
    
    Args:
        frontend_json: 前端发送的JSON数据
        
    Returns:
        后端期望的多工作流JSON格式
        
    Raises:
        ValueError: 当转换失败或验证失败时
    """
    converter = WorkflowConverter()
    
    try:
        # 执行转换
        backend_json = converter.convert_frontend_to_backend(frontend_json)
        
        # 验证转换结果
        is_valid, errors = converter.validate_conversion(frontend_json, backend_json)
        
        if not is_valid:
            error_msg = "工作流转换验证失败:\n" + "\n".join(errors)
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        logger.info("工作流格式转换成功")
        return backend_json
        
    except Exception as e:
        logger.error(f"工作流格式转换失败: {str(e)}")
        raise 