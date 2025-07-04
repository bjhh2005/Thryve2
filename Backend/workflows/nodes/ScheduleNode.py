from typing import Dict, Any, Optional, List
from .Node import Node
from ..scheduler.Scheduler import WorkflowScheduler
from ..events.EventBus import EventBus
import logging

class ScheduleNode(Node):
    def __init__(self, node_id: str, workflow_id: str, scheduler: WorkflowScheduler, type: str = 'schedule', nextNodes: List[str] = [], eventBus: Optional[EventBus] = None):
        super().__init__(node_id, type, nextNodes, eventBus)
        self.workflow_id = workflow_id
        self.scheduler = scheduler
        self.schedule_id: Optional[str] = None
        self.properties: Dict[str, Any] = {}
        self.logger = logging.getLogger(__name__)

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理调度节点"""
        try:
            schedule_type = self.properties.get('schedule_type', 'interval')
            schedule_config = self.properties.get('schedule_config', {})
            
            if not self.schedule_id:
                # 创建新的调度任务
                self.schedule_id = self.scheduler.add_schedule(
                    self.workflow_id,
                    schedule_type,
                    schedule_config
                )
            else:
                # 更新现有调度任务
                self.scheduler.update_schedule(self.schedule_id, schedule_config)
            
            return {
                'schedule_id': self.schedule_id,
                'status': 'success',
                'message': f'调度任务已{("更新" if self.schedule_id else "创建")}'
            }
            
        except Exception as e:
            self.logger.error(f"设置调度任务时出错: {str(e)}")
            return {
                'status': 'error',
                'message': f'设置调度任务失败: {str(e)}'
            }

    def cleanup(self):
        """清理调度任务"""
        if self.schedule_id:
            try:
                self.scheduler.remove_schedule(self.schedule_id)
                self.schedule_id = None
            except Exception as e:
                self.logger.error(f"清理调度任务时出错: {str(e)}")

    @staticmethod
    def get_metadata():
        """获取节点元数据"""
        return {
            'label': '调度节点',
            'description': '设置工作流的执行调度',
            'icon': 'schedule',
            'category': 'control',
            'properties': {
                'schedule_type': {
                    'type': 'string',
                    'enum': ['interval', 'cron', 'event', 'condition'],
                    'default': 'interval',
                    'description': '调度类型'
                },
                'schedule_config': {
                    'type': 'object',
                    'properties': {
                        'interval': {
                            'type': 'number',
                            'description': '执行间隔（秒）',
                            'minimum': 1,
                            'default': 60
                        },
                        'cron': {
                            'type': 'string',
                            'description': 'Cron表达式',
                            'pattern': '^\\s*\\d+\\s+\\d+\\s+\\d+\\s+\\d+\\s+\\d+\\s*$',
                            'default': '0 0 * * *'
                        },
                        'event_type': {
                            'type': 'string',
                            'description': '触发事件类型'
                        },
                        'condition': {
                            'type': 'object',
                            'description': '触发条件配置'
                        }
                    }
                }
            }
        } 