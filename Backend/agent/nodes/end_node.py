"""结束节点"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any

sys.path.append(str(Path(__file__).parent.parent))
from nodes.base import BaseNode
from states.workflow_state import WorkflowState

logger = logging.getLogger("EndNode")

class EndNode(BaseNode):
    """工作流结束节点"""
    
    def __init__(self):
        """初始化结束节点"""
        super().__init__()
        
    def process(self, state: WorkflowState) -> Dict[str, Any]:
        """处理工作流状态
        
        Args:
            state: 当前工作流状态
            
        Returns:
            Dict[str, Any]: 最终状态
        """
        logger.info("工作流执行完成")
        return state 