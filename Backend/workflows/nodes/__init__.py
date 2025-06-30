#nodes/__init__.py
from .Start import Start
from .FileInput import FileInput
from .ConditionNode import ConditionNode
from .Print import Print
from .Loop import Loop
from .End import End
from .TextProcessor import TextProcessor
from .CSV import CSVProcessor
from .JSON import JSONProcessor


__version__ = "1.0.0"

__all__ = ["Start", "FileInput", "ConditionNode", "Print", "Loop", "End", "TextProcessor", "CSVProcessor", "JSONProcessor"]
