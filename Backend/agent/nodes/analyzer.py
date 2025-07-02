"""需求分析节点"""

import json
import sys
from pathlib import Path
from typing import Dict, Any

sys.path.append(str(Path(__file__).parent.parent))
from nodes.base import BaseNode
from states.workflow_state import WorkflowState
from utils.llm import LLMUtil
from prompts.prompt_loader import load_prompt_template

class RequirementAnalyzer(BaseNode):
    """需求分析节点"""
    
    def __init__(self):
        """初始化分析器"""
        super().__init__()
        self.llm = LLMUtil()
        self.system_prompt = load_prompt_template("analyzer/system.md")
        self.logger.info("加载分析器系统提示词模板完成")
        
    def process(self, state: WorkflowState) -> Dict[str, Any]:
        """分析用户需求
        
        Args:
            state: 当前工作流状态
            
        Returns:
            Dict[str, Any]: 包含分析结果的状态
        """
        self.logger.info("开始分析用户需求...")
        self.logger.debug(f"输入需求: {state['requirement']}")
        
        try:
            self.logger.info("调用LLM进行需求分析")
            response = self.llm.invoke(
                system_prompt=self.system_prompt,
                human_input=state["requirement"]
            )
            self.logger.debug(f"LLM原始响应: {response}")
            
            # 尝试解析JSON响应
            try:
                self.logger.info("尝试将响应解析为JSON格式")
                analysis = json.loads(response)
                self.logger.info("JSON解析成功")
            except json.JSONDecodeError:
                self.logger.warning("响应不是JSON格式，将作为原始文本处理")
                # 如果不是JSON格式，将文本响应包装成字典
                analysis = {"raw_analysis": response}
            
            self.logger.info("需求分析完成")
            self.logger.debug(f"分析结果: {analysis}")
            return {"analysis": analysis}
            
        except Exception as e:
            self.logger.error(f"需求分析过程出错: {str(e)}", exc_info=True)
            return {"error": f"需求分析失败: {str(e)}"} 