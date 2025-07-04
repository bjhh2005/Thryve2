#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试脚本：验证workflow_example.json能否被后端正确处理
"""

import json
import sys
import os
import logging
from unittest.mock import Mock

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from workflows.WorkflowManager import WorkflowManager

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 启用CallNode的调试日志
logging.getLogger('CallNode').setLevel(logging.INFO)

class MockSocketIO:
    """模拟SocketIO实例"""
    def __init__(self):
        self.events = []
        
    def emit(self, event, data, namespace=None):
        """模拟事件发送"""
        self.events.append({
            'event': event,
            'data': data,
            'namespace': namespace
        })
        # 只打印失败的节点状态变化
        if event == 'node_status_change':
            status = data.get('status')
            if status == 'FAILED':
                node_id = data.get('nodeId', 'unknown')
                workflow_id = data.get('workflowId', 'unknown')
                payload = data.get('payload', {})
                logger.error(f"❌ 节点失败: {workflow_id}.{node_id} - {payload}")
        
    def sleep(self, seconds):
        """模拟sleep"""
        pass

def test_workflow_example():
    """测试workflow_example.json"""
    logger.info("=" * 60)
    logger.info("开始测试 workflow_example.json")
    logger.info("=" * 60)
    
    # 1. 加载JSON文件
    try:
        with open('workflow_example.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info("✅ JSON文件加载成功")
    except Exception as e:
        logger.error(f"❌ JSON文件加载失败: {e}")
        return False
    
    # 2. 验证基本结构
    workflows = data.get("workflows", {})
    main_workflows = [wf_id for wf_id, wf_data in workflows.items() if wf_data.get("type") == "main"]
    sub_workflows = [wf_id for wf_id, wf_data in workflows.items() if wf_data.get("type") == "sub"]
    
    logger.info(f"发现工作流: 主工作流={main_workflows}, 子工作流={sub_workflows}")
    
    if len(main_workflows) != 1:
        logger.error(f"❌ 主工作流数量错误: {len(main_workflows)}")
        return False
    
    # 3. 创建WorkflowManager并注册工作流
    try:
        mock_socketio = MockSocketIO()
        manager = WorkflowManager(mock_socketio)
        manager.register_workflows(workflows)
        logger.info(f"✅ WorkflowManager创建成功，注册了{len(workflows)}个工作流")
    except Exception as e:
        logger.error(f"❌ WorkflowManager创建失败: {e}")
        return False
    
    # 4. 执行工作流
    try:
        logger.info("🚀 开始执行工作流...")
        logger.info("-" * 40)
        
        success, message = manager.run()
        
        logger.info("-" * 40)
        if success:
            logger.info(f"✅ 工作流执行成功: {message}")
        else:
            logger.error(f"❌ 工作流执行失败: {message}")
            return False
            
    except Exception as e:
        logger.error(f"❌ 工作流执行异常: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False
    
    # 5. 检查内存使用情况
    try:
        memory_summary = manager.get_memory_usage_summary()
        logger.info("📊 内存使用情况:")
        logger.info(f"  总工作流数: {memory_summary['total_workflows']}")
        logger.info(f"  主工作流: {memory_summary['main_workflow']}")
        
        for workflow in memory_summary['active_workflows']:
            logger.info(f"  工作流 {workflow['id']}: 类型={workflow['type']}, "
                       f"状态={workflow['status']}, 节点实例={workflow['node_instances']}")
        
        # 检查子工作流内存清理
        sub_workflows_with_memory = [wf for wf in memory_summary['active_workflows'] 
                                   if wf['type'] == 'sub' and wf['node_instances'] > 0]
        
        if len(sub_workflows_with_memory) == 0:
            logger.info("✅ 子工作流内存已正确清理")
        else:
            logger.warning(f"⚠️  仍有{len(sub_workflows_with_memory)}个子工作流占用内存")
            
    except Exception as e:
        logger.error(f"❌ 内存检查失败: {e}")
        return False
    
    # 6. 分析执行事件
    logger.info("📋 执行事件统计:")
    event_counts = {}
    node_events = []
    
    for event in mock_socketio.events:
        event_type = event['event']
        event_counts[event_type] = event_counts.get(event_type, 0) + 1
        
        if event_type == 'node_status_change':
            data = event['data']
            node_events.append({
                'node': data.get('nodeId'),
                'workflow': data.get('workflowId'),
                'status': data.get('status'),
                'payload': data.get('payload')
            })
    
    for event_type, count in event_counts.items():
        logger.info(f"  {event_type}: {count}次")
    
    # 统计各个节点的执行情况
    logger.info("🔍 节点执行详情:")
    success_nodes = [e for e in node_events if e['status'] == 'SUCCEEDED']
    failed_nodes = [e for e in node_events if e['status'] == 'FAILED']
    
    logger.info(f"  成功节点: {len(success_nodes)}个")
    for node_event in success_nodes:
        logger.info(f"    ✅ {node_event['workflow']}.{node_event['node']}")
    
    if failed_nodes:
        logger.info(f"  失败节点: {len(failed_nodes)}个")
        for node_event in failed_nodes:
            logger.error(f"    ❌ {node_event['workflow']}.{node_event['node']}: {node_event.get('payload', {})}")
        return False
    
    logger.info("=" * 60)
    logger.info("🎉 所有测试通过！workflow_example.json完全兼容后端")
    logger.info("=" * 60)
    return True

if __name__ == "__main__":
    success = test_workflow_example()
    if success:
        print("\n✅ 测试结果: 成功")
        sys.exit(0)
    else:
        print("\n❌ 测试结果: 失败")
        sys.exit(1) 