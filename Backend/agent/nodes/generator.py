"""工作流JSON生成节点"""

import json
import sys
from pathlib import Path
from typing import Dict, Any

sys.path.append(str(Path(__file__).parent.parent))
from nodes.base import BaseNode
from states.workflow_state import WorkflowState
from utils.llm import LLMUtil
from prompts.prompt_loader import load_prompt_template

class WorkflowGenerator(BaseNode):
    """工作流JSON生成节点"""
    
    def __init__(self):
        """初始化生成器"""
        super().__init__()
        self.llm = LLMUtil()
        self.system_prompt = load_prompt_template("generator/system.md")
        self.logger.info("加载生成器系统提示词模板完成")
        
    def process(self, state: WorkflowState) -> Dict[str, Any]:
        """生成工作流JSON
        
        Args:
            state: 当前工作流状态
            
        Returns:
            Dict[str, Any]: 包含工作流JSON的状态
        """
        self.logger.info("开始生成工作流JSON...")
        
        try:
            if "plan" not in state:
                self.logger.error("状态中缺少执行计划")
                raise ValueError("缺少执行计划")
            
            self.logger.debug(f"输入的执行计划: {state['plan']}")
            human_input = f"基于以下执行计划生成工作流JSON：\n{state['plan']}"
            
            self.logger.info("调用LLM生成工作流JSON")
            response = self.llm.invoke(
                system_prompt=self.system_prompt,
                human_input=human_input
            )
            self.logger.debug(f"LLM原始响应: {response}")
            
            # 解析JSON响应
            try:
                self.logger.info("尝试解析生成的JSON")
                workflow_json = json.loads(response)
                self.logger.info("JSON解析成功")
                self.logger.debug(f"解析后的工作流JSON: {json.dumps(workflow_json, indent=2, ensure_ascii=False)}")
            except json.JSONDecodeError as e:
                self.logger.error(f"JSON解析失败: {str(e)}")
                raise ValueError("生成的JSON格式不正确")
                
            self.logger.info("工作流JSON生成完成")
            return {"workflow_json": workflow_json}
            
        except Exception as e:
            self.logger.error(f"工作流JSON生成过程出错: {str(e)}", exc_info=True)
            return {"error": f"工作流生成失败: {str(e)}"} 