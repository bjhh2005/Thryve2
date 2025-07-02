"""基础节点类"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any

sys.path.append(str(Path(__file__).parent.parent))
from states.workflow_state import WorkflowState

class BaseNode:
    """工作流节点基类"""
    
    def __init__(self):
        """初始化节点"""
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info(f"初始化{self.__class__.__name__}节点")
        
    def process(self, state: WorkflowState) -> Dict[str, Any]:
        """处理工作流状态
        
        Args:
            state: 当前工作流状态
            
        Returns:
            Dict[str, Any]: 更新后的状态
        """
        raise NotImplementedError("子类必须实现 process 方法") 