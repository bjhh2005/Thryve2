"""工作流验证节点"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, Set

sys.path.append(str(Path(__file__).parent.parent))
from nodes.base import BaseNode
from states.workflow_state import WorkflowState

class WorkflowValidator(BaseNode):
    """工作流验证节点"""
    
    def __init__(self):
        """初始化验证器"""
        super().__init__()
        self.required_node_types = {"start", "end"}
        self.available_node_types = {
            "start", "end", "file_input", "folder_input",
            "text_processor", "image_processor", "pdf_processor",
            "json_processor", "llm", "condition", "loop", "print"
        }
        self.logger.info(f"初始化验证器，支持的节点类型: {self.available_node_types}")
        
    def process(self, state: WorkflowState) -> Dict[str, Any]:
        """验证工作流JSON
        
        Args:
            state: 当前工作流状态
            
        Returns:
            Dict[str, Any]: 验证结果
        """
        self.logger.info("开始验证工作流JSON...")
        
        try:
            if "workflow_json" not in state:
                self.logger.error("状态中缺少工作流JSON")
                raise ValueError("缺少工作流JSON")
                
            workflow = state["workflow_json"]
            self.logger.debug(f"待验证的工作流: {json.dumps(workflow, indent=2, ensure_ascii=False)}")
            
            # 验证基本结构
            self.logger.info("验证工作流基本结构...")
            if "nodes" not in workflow or "edges" not in workflow:
                self.logger.error("工作流JSON结构不完整")
                raise ValueError("工作流JSON缺少nodes或edges字段")
            
            self.logger.info(f"工作流包含 {len(workflow['nodes'])} 个节点和 {len(workflow['edges'])} 条边")
            
            # 验证节点
            self.logger.info("开始验证节点...")
            self._validate_nodes(workflow["nodes"])
            self.logger.info("节点验证通过")
            
            # 验证边
            self.logger.info("开始验证边...")
            self._validate_edges(workflow["edges"], workflow["nodes"])
            self.logger.info("边验证通过")
            
            self.logger.info("工作流验证完成，未发现问题")
            return {}
            
        except Exception as e:
            self.logger.error(f"工作流验证过程出错: {str(e)}", exc_info=True)
            return {"error": f"工作流验证失败: {str(e)}"}
            
    def _validate_nodes(self, nodes: list) -> None:
        """验证节点列表
        
        Args:
            nodes: 节点列表
        """
        self.logger.debug(f"开始验证 {len(nodes)} 个节点")
        
        if not nodes:
            self.logger.error("节点列表为空")
            raise ValueError("节点列表为空")
            
        # 检查必需字段
        node_ids = set()
        node_types = set()
        
        for node in nodes:
            # 验证节点ID
            if "id" not in node:
                self.logger.error("发现缺少ID的节点")
                raise ValueError("节点缺少id字段")
            if node["id"] in node_ids:
                self.logger.error(f"发现重复的节点ID: {node['id']}")
                raise ValueError(f"重复的节点ID: {node['id']}")
            node_ids.add(node["id"])
            
            # 验证节点类型
            if "type" not in node:
                self.logger.error(f"节点 {node['id']} 缺少类型")
                raise ValueError(f"节点 {node['id']} 缺少type字段")
            if node["type"] not in self.available_node_types:
                self.logger.error(f"节点 {node['id']} 使用了不支持的类型: {node['type']}")
                raise ValueError(f"不支持的节点类型: {node['type']}")
            node_types.add(node["type"])
            self.logger.debug(f"验证节点 {node['id']} (类型: {node['type']}) 通过")
            
            # 验证节点数据
            if "data" not in node:
                self.logger.error(f"节点 {node['id']} 缺少数据字段")
                raise ValueError(f"节点 {node['id']} 缺少data字段")
                
        # 检查必需的节点类型
        missing_types = self.required_node_types - node_types
        if missing_types:
            self.logger.error(f"缺少必需的节点类型: {missing_types}")
            raise ValueError(f"缺少必需的节点类型: {missing_types}")
            
    def _validate_edges(self, edges: list, nodes: list) -> None:
        """验证边列表
        
        Args:
            edges: 边列表
            nodes: 节点列表
        """
        self.logger.debug(f"开始验证 {len(edges)} 条边")
        
        if not edges:
            self.logger.error("边列表为空")
            raise ValueError("边列表为空")
            
        node_ids = {node["id"] for node in nodes}
        
        for edge in edges:
            # 验证边的结构
            if "sourceNodeID" not in edge or "targetNodeID" not in edge:
                self.logger.error("发现结构不完整的边")
                raise ValueError("边缺少sourceNodeID或targetNodeID字段")
                
            # 验证节点存在
            if edge["sourceNodeID"] not in node_ids:
                self.logger.error(f"边的源节点不存在: {edge['sourceNodeID']}")
                raise ValueError(f"边的源节点不存在: {edge['sourceNodeID']}")
            if edge["targetNodeID"] not in node_ids:
                self.logger.error(f"边的目标节点不存在: {edge['targetNodeID']}")
                raise ValueError(f"边的目标节点不存在: {edge['targetNodeID']}")
                
            self.logger.debug(f"验证边 {edge['sourceNodeID']} -> {edge['targetNodeID']} 通过")
            
        # TODO: 可以添加更多验证，如：
        # - 检查是否有环
        # - 检查是否所有节点都可达
        # - 检查数据类型匹配 