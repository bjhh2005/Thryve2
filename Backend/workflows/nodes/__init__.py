#nodes/__init__.py
from .Start import Start
from .FileInput import FileInput
from .ConditionNode import ConditionNode
from .Print import Print
from .Loop import Loop
from .End import End
from .TextProcessor import TextProcessor
from .PdfProcessor import PdfProcessor

# 重命名导出的类，避免与模块名冲突

__version__ = "1.0.0"

__all__ = ["Start", "FileInput", "ConditionNode", "Print", "Loop", "End", "TextProcessor", "PdfProcessor"]