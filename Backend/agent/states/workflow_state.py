"""工作流状态
定义工作流执行过程中的状态数据结构
"""

from typing import Dict, Any, TypedDict, Optional

class ValidationError(TypedDict, total=False):
    """验证错误信息"""
    type: str  # 错误类型
    message: str  # 错误信息
    details: Dict[str, Any]  # 详细信息

class WorkflowState(TypedDict, total=False):
    """工作流状态
    
    使用 TypedDict 来定义状态字段，total=False 表示所有字段都是可选的
    """
    # 输入
    requirement: str  # 用户原始需求
    
    # 分析阶段
    analysis: Dict[str, Any]  # 需求分析结果
    analysis_error: str  # 分析错误信息
    
    # 规划阶段
    plan: Dict[str, Any]  # 工作流执行计划
    planning_error: str  # 规划错误信息
    
    # 生成阶段
    workflow_json: Dict[str, Any]  # 生成的工作流JSON
    generation_error: str  # 生成错误信息
    
    # 验证阶段
    json_validation_error: ValidationError  # JSON验证错误
    workflow_validation_error: ValidationError  # 工作流验证错误
    
    # 其他元数据
    metadata: Dict[str, Any]  # 其他元数据信息
    retry_count: int  # 重试次数
    
    @classmethod
    def create_initial(cls, requirement: str) -> 'WorkflowState':
        """创建初始状态
        
        Args:
            requirement: 用户需求
            
        Returns:
            WorkflowState: 初始状态对象
        """
        return cls(
            requirement=requirement,
            retry_count=0,
            metadata={}
        )
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'WorkflowState':
        """从字典创建状态
        
        Args:
            data: 状态数据字典
            
        Returns:
            WorkflowState: 状态对象
        """
        return cls(**data)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 状态数据字典
        """
        return dict(self)
    
    def has_error(self) -> bool:
        """检查是否存在错误
        
        Returns:
            bool: 是否存在错误
        """
        error_fields = [
            'analysis_error',
            'planning_error',
            'generation_error',
            'json_validation_error',
            'workflow_validation_error'
        ]
        return any(self.get(field) for field in error_fields)
    
    def get_error_details(self) -> Dict[str, Any]:
        """获取错误详情
        
        Returns:
            Dict[str, Any]: 错误详情
        """
        errors = {}
        if self.get('analysis_error'):
            errors['analysis'] = self['analysis_error']
        if self.get('planning_error'):
            errors['planning'] = self['planning_error']
        if self.get('generation_error'):
            errors['generation'] = self['generation_error']
        if self.get('json_validation_error'):
            errors['json_validation'] = self['json_validation_error']
        if self.get('workflow_validation_error'):
            errors['workflow_validation'] = self['workflow_validation_error']
        return errors
    
    def increment_retry(self) -> None:
        """增加重试次数"""
        self['retry_count'] = self.get('retry_count', 0) + 1 