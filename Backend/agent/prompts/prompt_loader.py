"""提示词模板加载器"""

import os
from pathlib import Path

def load_prompt_template(template_path: str) -> str:
    """加载提示词模板
    
    Args:
        template_path: 模板文件路径，相对于 templates 目录
        
    Returns:
        str: 模板内容
    """
    # 获取当前文件所在目录
    current_dir = Path(__file__).parent
    template_file = current_dir / "templates" / template_path
    
    if not template_file.exists():
        raise FileNotFoundError(f"Template file not found: {template_file}")
        
    with open(template_file, "r", encoding="utf-8") as f:
        return f.read() 