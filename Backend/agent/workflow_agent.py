"""工作流代理
协调各个节点完成从需求到工作流JSON的转换
"""

import json
import time
import sys
import logging
from pathlib import Path
from typing import Dict, Any, Literal

sys.path.append(str(Path(__file__).parent))
from langgraph.graph import StateGraph

from states.workflow_state import WorkflowState
from nodes.analyzer import RequirementAnalyzer
from nodes.planner import WorkflowPlanner
from nodes.generator import WorkflowGenerator
from nodes.json_validator import JSONValidator
from nodes.validator import WorkflowValidator
from nodes.end_node import EndNode

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("WorkflowAgent")

class WorkflowAgent:
    """工作流代理"""
    
    def __init__(self):
        """初始化代理"""
        logger.info("初始化工作流代理...")
        
        # 创建节点
        logger.info("创建处理节点...")
        self.analyzer = RequirementAnalyzer()
        self.planner = WorkflowPlanner()
        self.generator = WorkflowGenerator()
        self.json_validator = JSONValidator()
        self.validator = WorkflowValidator()
        self.end_node = EndNode()
        
        # 创建输出目录
        self.output_dir = Path("outputs")
        self.output_dir.mkdir(exist_ok=True)
        
        # 构建工作流图
        logger.info("构建工作流图...")
        self.graph = self._build_graph()
        logger.info("工作流代理初始化完成")
        
    def _save_result(self, result: Dict[str, Any], timestamp: str) -> None:
        """保存处理结果
        
        Args:
            result: 处理结果
            timestamp: 时间戳
        """
        # 保存完整结果
        result_file = self.output_dir / f"result_{timestamp}.json"
        with open(result_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        logger.info(f"完整结果已保存到: {result_file}")
        
        # 如果生成了工作流，单独保存
        if "workflow_json" in result and "error" not in result:
            workflow_file = self.output_dir / f"workflow_{timestamp}.json"
            with open(workflow_file, "w", encoding="utf-8") as f:
                json.dump(result["workflow_json"], f, ensure_ascii=False, indent=2)
            logger.info(f"工作流JSON已保存到: {workflow_file}")
            
        # 如果有错误，单独保存错误日志
        if "error" in result:
            error_file = self.output_dir / f"error_{timestamp}.json"
            with open(error_file, "w", encoding="utf-8") as f:
                json.dump({"error": result["error"]}, f, ensure_ascii=False, indent=2)
            logger.error(f"错误信息已保存到: {error_file}")
            
    def _handle_validation_result(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """处理验证结果，决定下一步操作
        
        Args:
            state: 当前状态
            
        Returns:
            Dict[str, Any]: 更新后的状态，包含下一步操作
        """
        next_step = None
        
        # 检查JSON验证结果
        if "json_validation_error" in state:
            logger.warning("JSON验证失败，需要重新生成")
            next_step = "generator"
            
        # 检查工作流验证结果
        elif "workflow_validation_error" in state:
            error_type = state.get("workflow_validation_error", {}).get("type")
            if error_type == "planning_error":
                logger.warning("工作流规划错误，需要重新规划")
                next_step = "planner"
            else:
                logger.warning("工作流验证失败，需要重新生成")
                next_step = "generator"
                
        else:
            # 验证通过
            logger.info("验证通过，工作流生成成功")
            next_step = "end"
            
        # 更新状态
        state["next_step"] = next_step
        return state
        
    def _route_next(self, state: Dict[str, Any]) -> Literal["planner", "generator", "end"]:
        """根据状态决定下一个节点
        
        Args:
            state: 当前状态
            
        Returns:
            str: 下一个节点的名称
        """
        return state["next_step"]
        
    def _build_graph(self) -> StateGraph:
        """构建状态图
        
        Returns:
            StateGraph: 编译后的状态图
        """
        # 创建图
        logger.info("开始构建状态图...")
        graph = StateGraph(WorkflowState)
        
        # 添加节点
        logger.debug("添加处理节点到图中...")
        graph.add_node("analyzer", self.analyzer.process)
        graph.add_node("planner", self.planner.process)
        graph.add_node("generator", self.generator.process)
        graph.add_node("json_validator", self.json_validator.process)
        graph.add_node("validator", self.validator.process)
        
        # 添加路由节点
        graph.add_node("router", self._handle_validation_result)
        
        # 添加结束节点
        graph.add_node("end", self.end_node.process)
        
        # 添加边
        logger.debug("添加节点之间的连接...")
        # 主流程
        graph.add_edge("analyzer", "planner")
        graph.add_edge("planner", "generator")
        graph.add_edge("generator", "json_validator")
        graph.add_edge("json_validator", "validator")
        graph.add_edge("validator", "router")
        
        # 条件分支
        # 从路由器到可能的目标节点
        graph.add_conditional_edges(
            "router",
            self._route_next,
            {
                "planner": "planner",  # 重新规划
                "generator": "generator",  # 重新生成
                "end": "end"  # 验证通过
            }
        )
        
        # 设置入口和出口
        logger.debug("设置图的入口和出口节点...")
        graph.set_entry_point("analyzer")
        graph.set_finish_point("end")
        
        logger.info("状态图构建完成")
        return graph.compile()
        
    async def process_requirement(self, requirement: str) -> Dict[str, Any]:
        """处理用户需求
        
        Args:
            requirement: 用户需求
            
        Returns:
            Dict[str, Any]: 处理结果
        """
        logger.info(f"开始处理用户需求: {requirement}")
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # 初始状态
        state = {"requirement": requirement}
        
        try:
            # 执行工作流
            logger.info("开始执行工作流...")
            result = self.graph.invoke(state)
            
            # 保存结果
            self._save_result(result, timestamp)
            
            return result
            
        except Exception as e:
            error_msg = f"工作流执行过程中发生异常: {str(e)}"
            logger.error(error_msg)
            error_result = {"error": error_msg}
            self._save_result(error_result, timestamp)
            return error_result

import asyncio
# CLI测试接口
if __name__ == "__main__":
    async def main():
        try:
            # 创建代理
            agent = WorkflowAgent()
            
            # 从文件读取需求
            requirement_file = Path(__file__).parent / "inputs" / "example_requirement.txt"
            if not requirement_file.exists():
                logger.error(f"需求文件不存在: {requirement_file}")
                sys.exit(1)
                
            with open(requirement_file, 'r', encoding='utf-8') as f:
                requirement = f.read().strip()
            
            logger.info(f"从文件读取需求: {requirement_file}")
            
            # 处理需求
            result = await agent.process_requirement(requirement)
            
            # 提示用户查看结果文件
            logger.info("\n处理完成，请查看 outputs 目录下的结果文件")
            
        except Exception as e:
            logger.error(f"程序执行出错: {str(e)}")
            sys.exit(1)
    
    # 运行程序
    asyncio.run(main()) 