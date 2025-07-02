"""JSON验证专家节点"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Set
from collections import defaultdict

sys.path.append(str(Path(__file__).parent.parent))
from nodes.base import BaseNode
from states.workflow_state import WorkflowState
from utils.llm import LLMUtil
from prompts.prompt_loader import load_prompt_template

class JSONValidator(BaseNode):
    """JSON验证专家节点"""
    
    def __init__(self):
        """初始化验证器"""
        super().__init__()
        self.llm = LLMUtil()
        self.system_prompt = load_prompt_template("validator/system.md")
        self.logger.info("JSON验证专家初始化完成，已加载系统提示词")
        
    def process(self, state: WorkflowState) -> Dict[str, Any]:
        """验证工作流JSON
        
        Args:
            state: 当前工作流状态
            
        Returns:
            Dict[str, Any]: 验证结果
        """
        self.logger.info("开始进行JSON验证...")
        
        try:
            if "workflow_json" not in state:
                self.logger.error("状态中缺少workflow_json字段")
                raise ValueError("缺少工作流JSON")
                
            workflow = state["workflow_json"]
            self.logger.debug(f"待验证的工作流JSON: {json.dumps(workflow, indent=2, ensure_ascii=False)}")
            
            # 首先进行基本验证
            self.logger.info("进行基本结构验证...")
            basic_errors = self._validate_basic_structure(workflow)
            if basic_errors:
                self.logger.error(f"基本结构验证失败: {basic_errors}")
                return self._format_errors(basic_errors)
            self.logger.info("基本结构验证通过")
                
            # 验证节点
            self.logger.info("进行节点验证...")
            node_errors = self._validate_nodes(workflow["nodes"])
            if node_errors:
                self.logger.error(f"节点验证失败: {node_errors}")
                return self._format_errors(node_errors)
            self.logger.info("节点验证通过")
                
            # 验证边
            self.logger.info("进行边验证...")
            edge_errors = self._validate_edges(workflow["edges"], workflow["nodes"])
            if edge_errors:
                self.logger.error(f"边验证失败: {edge_errors}")
                return self._format_errors(edge_errors)
            self.logger.info("边验证通过")
                
            # 验证数据类型
            self.logger.info("进行数据类型验证...")
            type_errors = self._validate_data_types(workflow)
            if type_errors:
                self.logger.error(f"数据类型验证失败: {type_errors}")
                return self._format_errors(type_errors)
            self.logger.info("数据类型验证通过")
                
            # 使用LLM进行最终验证
            self.logger.info("使用LLM进行最终验证...")
            llm_result = self._llm_validate(workflow)
            if "error" in llm_result:
                self.logger.error(f"LLM验证失败: {llm_result}")
                return llm_result
            self.logger.info("LLM验证通过")
            
            self.logger.info("JSON验证全部通过")
            return {}
            
        except Exception as e:
            self.logger.error(f"JSON验证过程出错: {str(e)}", exc_info=True)
            return {"error": f"JSON验证失败: {str(e)}"}
            
    def _validate_basic_structure(self, workflow: Dict) -> List[Dict]:
        """验证基本结构
        
        Args:
            workflow: 工作流JSON
            
        Returns:
            List[Dict]: 错误列表
        """
        self.logger.debug("检查工作流基本结构...")
        errors = []
        
        # 检查必需字段
        if "nodes" not in workflow:
            self.logger.warning("工作流缺少nodes字段")
            errors.append({
                "type": "missing_field",
                "message": "缺少nodes字段",
                "location": "root"
            })
            
        if "edges" not in workflow:
            self.logger.warning("工作流缺少edges字段")
            errors.append({
                "type": "missing_field",
                "message": "缺少edges字段",
                "location": "root"
            })
            
        if not isinstance(workflow.get("nodes", []), list):
            self.logger.warning("nodes字段不是数组类型")
            errors.append({
                "type": "type_error",
                "message": "nodes必须是数组",
                "location": "nodes"
            })
            
        if not isinstance(workflow.get("edges", []), list):
            self.logger.warning("edges字段不是数组类型")
            errors.append({
                "type": "type_error",
                "message": "edges必须是数组",
                "location": "edges"
            })
            
        if not errors:
            self.logger.debug("基本结构检查通过")
        return errors
        
    def _validate_nodes(self, nodes: List[Dict]) -> List[Dict]:
        """验证节点
        
        Args:
            nodes: 节点列表
            
        Returns:
            List[Dict]: 错误列表
        """
        self.logger.debug(f"开始验证 {len(nodes)} 个节点...")
        errors = []
        node_ids = set()
        
        allowed_types = {
            "start", "end", "file_input", "folder_input",
            "text_processor", "image_processor", "pdf_processor",
            "json_processor", "llm", "condition", "loop", "print"
        }
        
        for i, node in enumerate(nodes):
            self.logger.debug(f"验证节点 {i + 1}/{len(nodes)}")
            
            # 验证必需字段
            if "id" not in node:
                self.logger.warning(f"节点 {i} 缺少id字段")
                errors.append({
                    "type": "missing_field",
                    "message": f"节点 {i} 缺少id字段",
                    "location": f"nodes[{i}]"
                })
            elif node["id"] in node_ids:
                self.logger.warning(f"发现重复的节点ID: {node['id']}")
                errors.append({
                    "type": "duplicate_id",
                    "message": f"重复的节点ID: {node['id']}",
                    "location": f"nodes[{i}].id"
                })
            else:
                node_ids.add(node["id"])
                
            # 验证类型
            if "type" not in node:
                self.logger.warning(f"节点 {i} 缺少type字段")
                errors.append({
                    "type": "missing_field",
                    "message": f"节点 {i} 缺少type字段",
                    "location": f"nodes[{i}]"
                })
            elif node["type"] not in allowed_types:
                self.logger.warning(f"节点 {i} 使用了不支持的类型: {node['type']}")
                errors.append({
                    "type": "invalid_type",
                    "message": f"不支持的节点类型: {node['type']}",
                    "location": f"nodes[{i}].type"
                })
                
            # 验证meta
            if "meta" not in node or "position" not in node["meta"]:
                self.logger.warning(f"节点 {i} 缺少meta.position字段")
                errors.append({
                    "type": "missing_field",
                    "message": f"节点 {i} 缺少meta.position字段",
                    "location": f"nodes[{i}].meta"
                })
            elif not isinstance(node["meta"]["position"].get("x"), (int, float)) or \
                 not isinstance(node["meta"]["position"].get("y"), (int, float)):
                self.logger.warning(f"节点 {i} 的position坐标类型错误")
                errors.append({
                    "type": "type_error",
                    "message": f"节点 {i} 的position必须包含数字类型的x和y坐标",
                    "location": f"nodes[{i}].meta.position"
                })
                
            # 验证data
            if "data" not in node:
                self.logger.warning(f"节点 {i} 缺少data字段")
                errors.append({
                    "type": "missing_field",
                    "message": f"节点 {i} 缺少data字段",
                    "location": f"nodes[{i}]"
                })
            else:
                data = node["data"]
                if "title" not in data:
                    self.logger.warning(f"节点 {i} 缺少data.title字段")
                    errors.append({
                        "type": "missing_field",
                        "message": f"节点 {i} 缺少data.title字段",
                        "location": f"nodes[{i}].data"
                    })
                    
        if not errors:
            self.logger.debug("所有节点验证通过")
        return errors
        
    def _validate_edges(self, edges: List[Dict], nodes: List[Dict]) -> List[Dict]:
        """验证边
        
        Args:
            edges: 边列表
            nodes: 节点列表
            
        Returns:
            List[Dict]: 错误列表
        """
        self.logger.debug(f"开始验证 {len(edges)} 条边...")
        errors = []
        node_ids = {node["id"] for node in nodes}
        node_types = {node["id"]: node["type"] for node in nodes}
        
        # 统计节点的入度和出度
        in_degree = defaultdict(int)
        out_degree = defaultdict(int)
        
        for i, edge in enumerate(edges):
            self.logger.debug(f"验证边 {i + 1}/{len(edges)}")
            
            # 验证边的结构
            if "sourceNodeID" not in edge:
                self.logger.warning(f"边 {i} 缺少sourceNodeID字段")
                errors.append({
                    "type": "missing_field",
                    "message": f"边 {i} 缺少sourceNodeID字段",
                    "location": f"edges[{i}]"
                })
            elif edge["sourceNodeID"] not in node_ids:
                self.logger.warning(f"边 {i} 的源节点不存在: {edge['sourceNodeID']}")
                errors.append({
                    "type": "invalid_reference",
                    "message": f"边 {i} 的源节点不存在: {edge['sourceNodeID']}",
                    "location": f"edges[{i}].sourceNodeID"
                })
                
            if "targetNodeID" not in edge:
                self.logger.warning(f"边 {i} 缺少targetNodeID字段")
                errors.append({
                    "type": "missing_field",
                    "message": f"边 {i} 缺少targetNodeID字段",
                    "location": f"edges[{i}]"
                })
            elif edge["targetNodeID"] not in node_ids:
                self.logger.warning(f"边 {i} 的目标节点不存在: {edge['targetNodeID']}")
                errors.append({
                    "type": "invalid_reference",
                    "message": f"边 {i} 的目标节点不存在: {edge['targetNodeID']}",
                    "location": f"edges[{i}].targetNodeID"
                })
                
            # 检查自连接
            if edge.get("sourceNodeID") == edge.get("targetNodeID"):
                self.logger.warning(f"发现自连接节点: {edge['sourceNodeID']}")
                errors.append({
                    "type": "self_connection",
                    "message": f"节点不能自连接: {edge['sourceNodeID']}",
                    "location": f"edges[{i}]"
                })
                
            # 更新入度和出度
            in_degree[edge.get("targetNodeID")] += 1
            out_degree[edge.get("sourceNodeID")] += 1
            
        # 验证start和end节点的连接
        for node_id, node_type in node_types.items():
            if node_type == "start" and in_degree[node_id] > 0:
                self.logger.warning(f"start节点 {node_id} 不应该有入边")
                errors.append({
                    "type": "invalid_connection",
                    "message": "start节点不能有入边",
                    "location": f"node:{node_id}"
                })
            elif node_type == "end" and out_degree[node_id] > 0:
                self.logger.warning(f"end节点 {node_id} 不应该有出边")
                errors.append({
                    "type": "invalid_connection",
                    "message": "end节点不能有出边",
                    "location": f"node:{node_id}"
                })
            elif node_type not in {"start", "end"} and in_degree[node_id] == 0:
                self.logger.warning(f"节点 {node_id} 没有入边")
                errors.append({
                    "type": "disconnected_node",
                    "message": f"节点 {node_id} 没有入边",
                    "location": f"node:{node_id}"
                })
            elif node_type not in {"start", "end"} and out_degree[node_id] == 0:
                self.logger.warning(f"节点 {node_id} 没有出边")
                errors.append({
                    "type": "disconnected_node",
                    "message": f"节点 {node_id} 没有出边",
                    "location": f"node:{node_id}"
                })
                
        if not errors:
            self.logger.debug("所有边验证通过")
        return errors
        
    def _validate_data_types(self, workflow: Dict) -> List[Dict]:
        """验证数据类型
        
        Args:
            workflow: 工作流JSON
            
        Returns:
            List[Dict]: 错误列表
        """
        self.logger.debug("开始验证数据类型...")
        errors = []
        nodes = workflow["nodes"]
        edges = workflow["edges"]
        
        # 构建节点连接图
        connections = defaultdict(list)
        for edge in edges:
            connections[edge["sourceNodeID"]].append(edge["targetNodeID"])
            
        for node in nodes:
            node_id = node["id"]
            node_type = node["type"]
            
            # 验证条件节点
            if node_type == "condition":
                out_edges = len(connections[node_id])
                if out_edges != 2:
                    self.logger.warning(f"条件节点 {node_id} 的出边数量不正确: {out_edges}")
                    errors.append({
                        "type": "invalid_condition",
                        "message": f"条件节点必须有两个出边，当前有 {out_edges} 个",
                        "location": f"node:{node_id}"
                    })
                    
            # 验证循环节点
            elif node_type == "loop":
                if "loopVariable" not in node.get("data", {}).get("inputsValues", {}):
                    self.logger.warning(f"循环节点 {node_id} 未定义循环变量")
                    errors.append({
                        "type": "missing_loop_variable",
                        "message": "循环节点必须定义循环变量",
                        "location": f"node:{node_id}"
                    })
                    
        if not errors:
            self.logger.debug("数据类型验证通过")
        return errors
        
    def _llm_validate(self, workflow: Dict) -> Dict[str, Any]:
        """使用LLM进行最终验证
        
        Args:
            workflow: 工作流JSON
            
        Returns:
            Dict[str, Any]: 验证结果
        """
        self.logger.info("调用LLM进行最终验证...")
        
        response = self.llm.invoke(
            system_prompt=self.system_prompt,
            human_input=f"请验证以下工作流JSON：\n{json.dumps(workflow, ensure_ascii=False, indent=2)}"
        )
        self.logger.debug(f"LLM响应: {response}")
        
        try:
            result = json.loads(response)
            if not result.get("valid", False):
                self.logger.warning("LLM验证未通过")
                return {"error": "LLM验证失败", "details": result.get("errors", [])}
            self.logger.info("LLM验证通过")
            return {}
        except json.JSONDecodeError:
            self.logger.error("LLM返回的验证结果格式不正确")
            return {"error": "LLM返回的验证结果格式不正确"}
            
    def _format_errors(self, errors: List[Dict]) -> Dict[str, Any]:
        """格式化错误信息
        
        Args:
            errors: 错误列表
            
        Returns:
            Dict[str, Any]: 格式化的错误信息
        """
        return {
            "error": "JSON验证失败",
            "details": errors
        } 