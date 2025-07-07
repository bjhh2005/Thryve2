#!/usr/bin/env python3
"""
测试修复后的断点功能
"""

import socketio
import requests
import json
import time

# 简单的测试工作流
test_workflow = {
    "nodes": [
        {
            "id": "start_test",
            "type": "start",
            "data": {
                "title": "Start_Test",
                "outputs": {
                    "type": "object",
                    "properties": {
                        "message": {"type": "string", "default": "Hello Breakpoint"}
                    }
                }
            }
        },
        {
            "id": "print_test",
            "type": "print",
            "data": {
                "title": "Print_Test",
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
                    "input": {"type": "constant", "content": "这是断点测试消息"}
                }
            }
        },
        {
            "id": "end_test",
            "type": "end",
            "data": {
                "title": "End_Test",
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
        {"sourceNodeID": "start_test", "targetNodeID": "print_test"},
        {"sourceNodeID": "print_test", "targetNodeID": "end_test"}
    ]
}

def test_breakpoint():
    """测试断点功能"""
    print("🧪 开始测试断点功能...")
    
    # 创建Socket.IO客户端
    sio = socketio.Client()
    run_id = None
    events = []
    
    @sio.event
    def connect():
        print("✅ WebSocket连接成功")
    
    @sio.on('debug_session_started', namespace='/workflow')
    def on_debug_session_started(data):
        nonlocal run_id
        run_id = data['run_id']
        print(f"🎯 调试会话启动，Run ID: {run_id}")
    
    @sio.on('execution_paused', namespace='/workflow')
    def on_execution_paused(data):
        events.append(('paused', data))
        print(f"⏸️  执行暂停: {data['nodeId']} - {data.get('reason', '未知原因')}")
    
    @sio.on('execution_resumed', namespace='/workflow')
    def on_execution_resumed(data):
        events.append(('resumed', data))
        print(f"▶️  执行恢复: {data['nodeId']} - {data.get('reason', '未知原因')}")
    
    @sio.on('node_status_change', namespace='/workflow')
    def on_node_status_change(data):
        events.append(('status', data))
        print(f"📊 节点状态: {data['nodeId']} -> {data['status']}")
    
    @sio.on('nodes_output', namespace='/workflow')
    def on_nodes_output(data):
        events.append(('output', data))
        print(f"📤 节点输出: {data['message']}")
    
    @sio.on('over', namespace='/workflow')
    def on_workflow_finished(data):
        events.append(('finished', data))
        print(f"🎉 工作流完成: {data['status']} - {data['message']}")
    
    try:
        # 1. 连接WebSocket
        print("🔗 连接WebSocket...")
        sio.connect('http://localhost:5000', namespaces=['/workflow'])
        time.sleep(1)
        
        # 2. 启动调试会话（在print节点设置断点）
        print("🚀 启动调试会话，断点: print_test")
        sio.emit('start_debug', {
            'documentData': test_workflow,
            'breakpoints': ['print_test']
        }, namespace='/workflow')
        
        # 3. 等待到达断点
        print("⏳ 等待到达断点...")
        time.sleep(3)
        
        if run_id:
            # 4. 发送调试命令
            print("🎮 测试调试命令...")
            
            # 恢复执行
            print("  ▶️  发送恢复命令...")
            response = requests.post(f'http://localhost:5000/api/debug/{run_id}/command', 
                                    json={'command': 'resume'})
            if response.status_code == 200:
                print("  ✅ 恢复命令发送成功")
            else:
                print(f"  ❌ 恢复命令失败: {response.text}")
            
            # 等待完成
            time.sleep(3)
        
        # 5. 检查事件
        print(f"\n📋 收到的事件:")
        for i, (event_type, data) in enumerate(events):
            print(f"  {i+1}. {event_type}: {data.get('nodeId', 'N/A')} - {data.get('status', data.get('reason', data.get('message', 'N/A')))}")
        
        # 检查是否正确暂停和恢复
        paused_events = [e for e in events if e[0] == 'paused']
        resumed_events = [e for e in events if e[0] == 'resumed']
        
        if paused_events and resumed_events:
            print("\n🎉 断点功能测试成功！")
            print(f"  ✅ 暂停事件: {len(paused_events)} 个")
            print(f"  ✅ 恢复事件: {len(resumed_events)} 个")
            return True
        else:
            print("\n❌ 断点功能测试失败！")
            print(f"  ❌ 暂停事件: {len(paused_events)} 个")
            print(f"  ❌ 恢复事件: {len(resumed_events)} 个")
            return False
            
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        return False
    finally:
        if sio.connected:
            sio.disconnect()

def main():
    """主函数"""
    print("🩺 断点功能修复测试")
    print("=" * 50)
    
    success = test_breakpoint()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 测试通过！断点功能正常工作")
        print("\n💡 功能说明:")
        print("  ✅ 断点暂停功能正常")
        print("  ✅ HTTP API控制正常")
        print("  ✅ 状态同步正常")
    else:
        print("❌ 测试失败！需要进一步调试")

if __name__ == "__main__":
    main() 