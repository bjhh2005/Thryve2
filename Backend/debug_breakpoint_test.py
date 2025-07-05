#!/usr/bin/env python3
"""
详细的断点调试测试脚本
用于排查断点功能问题
"""

import socketio
import requests
import json
import time
import logging

# 设置详细日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 简单的测试工作流
test_workflow = {
    "nodes": [
        {
            "id": "start_debug",
            "type": "start",
            "data": {
                "title": "Start_Debug",
                "outputs": {
                    "type": "object",
                    "properties": {
                        "message": {"type": "string", "default": "开始调试测试"}
                    }
                }
            }
        },
        {
            "id": "print_debug",
            "type": "print",
            "data": {
                "title": "Print_Debug",
                "inputs": {
                    "type": "object",
                    "properties": {
                        "input": {"type": "string", "title": "Input Text"}
                    }
                },
                "outputs": {
                    "type": "object",
                    "properties": {
                        "result": {"type": "string", "title": "Printed Text"}
                    }
                },
                "inputsValues": {
                    "input": {"type": "constant", "content": "这里应该暂停！"}
                }
            }
        },
        {
            "id": "end_debug",
            "type": "end",
            "data": {
                "title": "End_Debug",
                "inputs": {
                    "type": "object",
                    "properties": {
                        "result": {"type": "string"}
                    }
                }
            }
        }
    ],
    "edges": [
        {"sourceNodeID": "start_debug", "targetNodeID": "print_debug"},
        {"sourceNodeID": "print_debug", "targetNodeID": "end_debug"}
    ]
}

class DetailedBreakpointTest:
    def __init__(self):
        self.sio = socketio.Client()
        self.run_id = None
        self.events = []
        self.paused = False
        self.resumed = False
        self.setup_event_handlers()
    
    def setup_event_handlers(self):
        """设置详细的事件处理器"""
        
        @self.sio.event
        def connect():
            logger.info("🔗 WebSocket连接成功")
        
        @self.sio.event
        def disconnect():
            logger.info("🔌 WebSocket连接断开")
        
        @self.sio.on('debug_session_started', namespace='/workflow')
        def on_debug_session_started(data):
            self.run_id = data['run_id']
            logger.info(f"🎯 调试会话启动 - Run ID: {self.run_id}")
            self.events.append(('debug_session_started', data))
        
        @self.sio.on('node_status_change', namespace='/workflow')
        def on_node_status_change(data):
            logger.info(f"📊 节点状态变化: {data['nodeId']} -> {data['status']}")
            self.events.append(('node_status_change', data))
        
        @self.sio.on('execution_paused', namespace='/workflow')
        def on_execution_paused(data):
            self.paused = True
            logger.info(f"⏸️  执行已暂停: {data['nodeId']} - 原因: {data.get('reason', '未知')}")
            self.events.append(('execution_paused', data))
        
        @self.sio.on('execution_resumed', namespace='/workflow')
        def on_execution_resumed(data):
            self.resumed = True
            logger.info(f"▶️  执行已恢复: {data['nodeId']} - 原因: {data.get('reason', '未知')}")
            self.events.append(('execution_resumed', data))
        
        @self.sio.on('execution_step_over', namespace='/workflow')
        def on_execution_step_over(data):
            logger.info(f"👟 单步执行: {data['nodeId']}")
            self.events.append(('execution_step_over', data))
        
        @self.sio.on('execution_terminated', namespace='/workflow')
        def on_execution_terminated(data):
            logger.info(f"🛑 执行已终止: {data.get('reason', '未知')}")
            self.events.append(('execution_terminated', data))
        
        @self.sio.on('nodes_output', namespace='/workflow')
        def on_nodes_output(data):
            logger.info(f"📤 节点输出: {data.get('data')} -> {data.get('message')}")
            self.events.append(('nodes_output', data))
        
        @self.sio.on('over', namespace='/workflow')
        def on_workflow_finished(data):
            logger.info(f"🎉 工作流完成: {data['status']} - {data['message']}")
            self.events.append(('over', data))
        
        @self.sio.on('info', namespace='/workflow')
        def on_info(data):
            logger.info(f"ℹ️  信息: {data}")
            self.events.append(('info', data))
        
        @self.sio.on('warning', namespace='/workflow')
        def on_warning(data):
            logger.warning(f"⚠️  警告: {data}")
            self.events.append(('warning', data))
        
        @self.sio.on('error', namespace='/workflow')
        def on_error(data):
            logger.error(f"❌ 错误: {data}")
            self.events.append(('error', data))
    
    def connect_websocket(self):
        """连接WebSocket"""
        try:
            logger.info("正在连接到WebSocket...")
            self.sio.connect('http://localhost:5000', namespaces=['/workflow'])
            time.sleep(1)
            return True
        except Exception as e:
            logger.error(f"WebSocket连接失败: {e}")
            return False
    
    def start_debug_session(self, breakpoints):
        """启动调试会话"""
        logger.info(f"🚀 启动调试会话，断点设置在: {breakpoints}")
        
        self.sio.emit('start_debug', {
            'documentData': test_workflow,
            'breakpoints': breakpoints
        }, namespace='/workflow')
        
        # 等待调试会话启动
        timeout = 10
        start_time = time.time()
        while not self.run_id and (time.time() - start_time) < timeout:
            time.sleep(0.1)
        
        return self.run_id is not None
    
    def send_debug_command(self, command):
        """发送调试命令"""
        if not self.run_id:
            logger.error("❌ 没有活跃的调试会话")
            return False
        
        try:
            url = f'http://localhost:5000/api/debug/{self.run_id}/command'
            logger.info(f"📡 发送调试命令: {command} 到 {url}")
            
            response = requests.post(url, json={'command': command})
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ 调试命令 '{command}' 执行成功: {result}")
                return True
            else:
                logger.error(f"❌ 调试命令失败 [{response.status_code}]: {response.text}")
                return False
        except Exception as e:
            logger.error(f"❌ 发送调试命令时出错: {e}")
            return False
    
    def wait_for_pause(self, timeout=10):
        """等待暂停事件"""
        logger.info(f"⏳ 等待暂停事件 (超时: {timeout}秒)...")
        start_time = time.time()
        while not self.paused and (time.time() - start_time) < timeout:
            time.sleep(0.1)
        
        if self.paused:
            logger.info("✅ 检测到暂停事件")
            return True
        else:
            logger.warning("⚠️  超时：未检测到暂停事件")
            return False
    
    def print_event_summary(self):
        """打印事件摘要"""
        logger.info("\n" + "="*60)
        logger.info("📋 事件摘要:")
        logger.info("="*60)
        
        for i, (event_type, data) in enumerate(self.events):
            logger.info(f"{i+1:2d}. {event_type:20s} - {str(data)[:80]}...")
        
        logger.info(f"\n📊 统计:")
        logger.info(f"  总事件数: {len(self.events)}")
        logger.info(f"  暂停事件: {len([e for e in self.events if e[0] == 'execution_paused'])}")
        logger.info(f"  恢复事件: {len([e for e in self.events if e[0] == 'execution_resumed'])}")
        logger.info(f"  节点状态变化: {len([e for e in self.events if e[0] == 'node_status_change'])}")
        logger.info(f"  节点输出: {len([e for e in self.events if e[0] == 'nodes_output'])}")
        logger.info("="*60)
    
    def disconnect(self):
        """断开连接"""
        if self.sio.connected:
            self.sio.disconnect()

def main():
    """主测试函数"""
    logger.info("🩺 开始详细的断点功能测试")
    logger.info("="*60)
    
    test_client = DetailedBreakpointTest()
    
    try:
        # 1. 连接WebSocket
        logger.info("步骤 1: 连接WebSocket")
        if not test_client.connect_websocket():
            logger.error("❌ 测试失败：无法连接WebSocket")
            return False
        
        # 2. 启动调试会话
        logger.info("\n步骤 2: 启动调试会话")
        breakpoints = ['print_debug']  # 在print节点设置断点
        if not test_client.start_debug_session(breakpoints):
            logger.error("❌ 测试失败：无法启动调试会话")
            return False
        
        # 3. 等待断点触发
        logger.info("\n步骤 3: 等待断点触发")
        if test_client.wait_for_pause(timeout=15):
            logger.info("✅ 断点成功触发！")
            
            # 4. 发送恢复命令
            logger.info("\n步骤 4: 发送恢复命令")
            time.sleep(2)  # 等待一下确保暂停稳定
            
            if test_client.send_debug_command('resume'):
                logger.info("✅ 恢复命令发送成功")
                
                # 等待工作流完成
                time.sleep(5)
                return True
            else:
                logger.error("❌ 恢复命令发送失败")
                return False
        else:
            logger.error("❌ 断点未触发")
            return False
    
    except Exception as e:
        logger.error(f"❌ 测试过程中出现异常: {e}")
        return False
    
    finally:
        # 打印事件摘要
        test_client.print_event_summary()
        test_client.disconnect()

if __name__ == "__main__":
    success = main()
    print("\n" + "="*60)
    if success:
        print("🎉 断点功能测试成功！")
    else:
        print("❌ 断点功能测试失败！")
    print("="*60) 