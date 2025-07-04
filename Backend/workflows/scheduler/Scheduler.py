from typing import Dict, Any, List, Optional, Callable
import threading
import time
from datetime import datetime, timedelta
import schedule
import logging
from ..events.EventBus import EventBus

class WorkflowScheduler:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.schedules: Dict[str, Dict[str, Any]] = {}
        self.running = False
        self.scheduler_thread = None
        self.logger = logging.getLogger(__name__)

    def add_schedule(self, workflow_id: str, schedule_type: str, schedule_config: Dict[str, Any]) -> str:
        """
        添加一个调度任务
        
        Args:
            workflow_id: 工作流ID
            schedule_type: 调度类型 ('interval', 'cron', 'event', 'condition')
            schedule_config: 调度配置
        
        Returns:
            schedule_id: 调度任务ID
        """
        schedule_id = f"{workflow_id}_{int(time.time())}"
        
        self.schedules[schedule_id] = {
            'workflow_id': workflow_id,
            'type': schedule_type,
            'config': schedule_config,
            'status': 'active',
            'last_run': None,
            'next_run': None,
            'created_at': datetime.now(),
        }
        
        self._setup_schedule(schedule_id)
        return schedule_id

    def remove_schedule(self, schedule_id: str) -> bool:
        """删除调度任务"""
        if schedule_id in self.schedules:
            schedule.cancel_job(self.schedules[schedule_id].get('job'))
            del self.schedules[schedule_id]
            return True
        return False

    def update_schedule(self, schedule_id: str, schedule_config: Dict[str, Any]) -> bool:
        """更新调度任务配置"""
        if schedule_id in self.schedules:
            # 取消旧的调度
            schedule.cancel_job(self.schedules[schedule_id].get('job'))
            # 更新配置
            self.schedules[schedule_id]['config'] = schedule_config
            # 重新设置调度
            self._setup_schedule(schedule_id)
            return True
        return False

    def get_schedule(self, schedule_id: str) -> Optional[Dict[str, Any]]:
        """获取调度任务信息"""
        return self.schedules.get(schedule_id)

    def list_schedules(self, workflow_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """列出所有调度任务"""
        if workflow_id:
            return [
                {'id': k, **v}
                for k, v in self.schedules.items()
                if v['workflow_id'] == workflow_id
            ]
        return [{'id': k, **v} for k, v in self.schedules.items()]

    def start(self):
        """启动调度器"""
        if not self.running:
            self.running = True
            self.scheduler_thread = threading.Thread(target=self._run_scheduler)
            self.scheduler_thread.daemon = True
            self.scheduler_thread.start()
            self.logger.info("调度器已启动")

    def stop(self):
        """停止调度器"""
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join()
            self.scheduler_thread = None
        self.logger.info("调度器已停止")

    def _run_scheduler(self):
        """运行调度器主循环"""
        while self.running:
            schedule.run_pending()
            time.sleep(1)

    def _setup_schedule(self, schedule_id: str):
        """设置具体的调度任务"""
        schedule_info = self.schedules[schedule_id]
        schedule_type = schedule_info['type']
        config = schedule_info['config']
        
        if schedule_type == 'interval':
            # 间隔执行
            interval = config.get('interval', 60)  # 默认60秒
            job = schedule.every(interval).seconds.do(
                self._execute_workflow, schedule_id
            )
        
        elif schedule_type == 'cron':
            # Cron 表达式执行
            cron = config.get('cron', '0 0 * * *')  # 默认每天零点
            parts = cron.split()
            if len(parts) == 5:
                minute, hour, day, month, day_of_week = parts
                job = schedule.every().day.at(f"{hour.zfill(2)}:{minute.zfill(2)}").do(
                    self._execute_workflow, schedule_id
                )
        
        elif schedule_type == 'event':
            # 事件触发
            event_type = config.get('event_type')
            if event_type:
                self.event_bus.on(event_type, lambda *args: self._execute_workflow(schedule_id))
                job = None
        
        elif schedule_type == 'condition':
            # 条件触发
            condition = config.get('condition')
            if condition:
                # 每分钟检查一次条件
                job = schedule.every(1).minutes.do(
                    self._check_and_execute, schedule_id, condition
                )
        
        if 'job' in locals():
            self.schedules[schedule_id]['job'] = job

    def _execute_workflow(self, schedule_id: str):
        """执行工作流"""
        try:
            workflow_id = self.schedules[schedule_id]['workflow_id']
            self.schedules[schedule_id]['last_run'] = datetime.now()
            
            # 通过事件总线触发工作流执行
            self.event_bus.emit('execute_workflow', workflow_id)
            self.logger.info(f"工作流 {workflow_id} 已调度执行")
            
            # 更新下次执行时间
            if self.schedules[schedule_id].get('job'):
                self.schedules[schedule_id]['next_run'] = self.schedules[schedule_id]['job'].next_run
                
        except Exception as e:
            self.logger.error(f"执行工作流 {workflow_id} 时出错: {str(e)}")

    def _check_and_execute(self, schedule_id: str, condition: Dict[str, Any]):
        """检查条件并执行工作流"""
        try:
            # 这里可以实现条件检查的逻辑
            # 例如检查文件是否存在、API是否可用等
            condition_met = self._evaluate_condition(condition)
            
            if condition_met:
                self._execute_workflow(schedule_id)
                
        except Exception as e:
            self.logger.error(f"检查条件时出错: {str(e)}")

    def _evaluate_condition(self, condition: Dict[str, Any]) -> bool:
        """评估条件是否满足"""
        condition_type = condition.get('type')
        
        if condition_type == 'file_exists':
            import os
            return os.path.exists(condition.get('path', ''))
            
        elif condition_type == 'api_available':
            import requests
            try:
                response = requests.get(condition.get('url', ''), timeout=5)
                return response.status_code == 200
            except:
                return False
                
        elif condition_type == 'custom':
            # 执行自定义Python表达式
            try:
                return eval(condition.get('expression', 'False'))
            except:
                return False
                
        return False 