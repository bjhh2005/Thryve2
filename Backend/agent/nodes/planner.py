"""执行计划节点"""

import json
import sys
from pathlib import Path
from typing import Dict, Any

sys.path.append(str(Path(__file__).parent.parent))
from nodes.base import BaseNode
from states.workflow_state import WorkflowState
from utils.llm import LLMUtil
from prompts.prompt_loader import load_prompt_template

class WorkflowPlanner(BaseNode):
    """执行计划节点"""
    
    def __init__(self):
        """初始化规划器"""
        super().__init__()
        self.llm = LLMUtil()
        self.system_prompt = load_prompt_template("planner/system.md")
        self.logger.info("加载规划器系统提示词模板完成")
        
    def process(self, state: WorkflowState) -> Dict[str, Any]:
        """生成执行计划
        
        Args:
            state: 当前工作流状态
            
        Returns:
            Dict[str, Any]: 包含执行计划的状态
        """
        self.logger.info("开始生成执行计划...")
        
        try:
            if "analysis" not in state:
                self.logger.error("状态中缺少需求分析结果")
                raise ValueError("缺少需求分析结果")
            
            self.logger.debug(f"输入的需求分析结果: {state['analysis']}")
            human_input = f"基于以下需求分析生成执行计划：\n{json.dumps(state['analysis'], ensure_ascii=False)}"
            
            self.logger.info("调用LLM生成执行计划")
            response = self.llm.invoke(
                system_prompt=self.system_prompt,
                human_input=human_input
            )
            self.logger.debug(f"LLM响应: {response}")
            
            self.logger.info("执行计划生成完成")
            return {"plan": response}
            
        except Exception as e:
            self.logger.error(f"执行计划生成过程出错: {str(e)}", exc_info=True)
            return {"error": f"计划生成失败: {str(e)}"} 