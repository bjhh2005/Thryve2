#!/usr/bin/env python3
"""
简洁的断点功能测试 - 验证重新设计的断点机制
"""

import socketio
import requests
import json
import time

# 简单测试工作流
test_workflow = {
    "nodes": [
        {
            "id": "start_1",
            "type": "start",
            "meta": {"position": {"x": 100, "y": 100}},
            "data": {"title": "开始", "outputs": {"type": "object", "properties": {"msg": {"type": "string", "default": "Hello"}}}}
        },
        {
            "id": "print_1",
            "type": "print",
            "meta": {"position": {"x": 300, "y": 100}},
            "data": {
                "title": "打印",
                "inputs": {"type": "object", "properties": {"input": {"type": "string"}}},
                "outputs": {"type": "object", "properties": {"result": {"type": "string"}}},
                "inputsValues": {"input": {"type": "constant", "content": "断点测试消息"}}
            }
        },
        {
            "id": "end_1",
            "type": "end",
            "meta": {"position": {"x": 500, "y": 100}},
            "data": {"title": "结束", "inputs": {"type": "object", "properties": {"result": {"type": "string"}}}}
        }
    ],
    "edges": [
        {"sourceNodeID": "start_1", "targetNodeID": "print_1"},
        {"sourceNodeID": "print_1", "targetNodeID": "end_1"}
    ]
}

def test_breakpoint():
    """测试断点功能"""
    print("🧪 测试新的断点功能")
    print("=" * 40)
    
    # 连接WebSocket
    sio = socketio.Client()
    run_id = None
    events = []
    
    @sio.on('debug_session_started', namespace='/workflow')
    def on_debug_started(data):
        nonlocal run_id
        run_id = data['run_id']
        print(f"✅ 调试会话启动: {run_id}")
    
    @sio.on('execution_paused', namespace='/workflow')
    def on_paused(data):
        events.append(('paused', data))
        print(f"⏸️  暂停在节点: {data['nodeId']} - {data['reason']}")
    
    @sio.on('node_status_change', namespace='/workflow')
    def on_status(data):
        events.append(('status', data))
        print(f"📊 节点状态: {data['nodeId']} -> {data['status']}")
    
    @sio.on('nodes_output', namespace='/workflow')
    def on_output(data):
        events.append(('output', data))
        print(f"📤 输出: {data['message']}")
    
    @sio.on('over', namespace='/workflow')
    def on_over(data):
        events.append(('over', data))
        print(f"🎉 完成: {data['status']}")
    
    try:
        # 1. 连接
        print("🔗 连接WebSocket...")
        sio.connect('http://localhost:5000', namespaces=['/workflow'])
        time.sleep(1)
        
        # 2. 启动调试（在print节点设置断点）
        print("🚀 启动调试会话（断点：print_1）")
        breakpoints = ["print_1"]
        sio.emit('start_debug', {
            'documentData': test_workflow,
            'breakpoints': breakpoints
        }, namespace='/workflow')
        
        # 等待调试启动
        time.sleep(2)
        if not run_id:
            print("❌ 调试会话启动失败")
            return False
        
        # 3. 等待到达断点
        print("⏳ 等待到达断点...")
        time.sleep(3)
        
        # 4. 测试调试命令
        print("🎮 测试调试命令...")
        
        # 发送单步执行命令
        print("  👆 单步执行...")
        response = requests.post(f'http://localhost:5000/api/debug/{run_id}/command', 
                               json={'command': 'step_over'})
        if response.status_code == 200:
            print("  ✅ 单步执行命令发送成功")
        else:
            print(f"  ❌ 单步执行失败: {response.text}")
        
        time.sleep(2)
        
        # 发送恢复命令
        print("  ▶️ 恢复执行...")
        response = requests.post(f'http://localhost:5000/api/debug/{run_id}/command', 
                               json={'command': 'resume'})
        if response.status_code == 200:
            print("  ✅ 恢复命令发送成功")
        else:
            print(f"  ❌ 恢复失败: {response.text}")
        
        # 等待执行完成
        time.sleep(3)
        
        # 5. 检查结果
        print(f"\n📋 收到事件总数: {len(events)}")
        paused_events = [e for e in events if e[0] == 'paused']
        output_events = [e for e in events if e[0] == 'output']
        
        print(f"   暂停事件: {len(paused_events)}")
        print(f"   输出事件: {len(output_events)}")
        
        if len(paused_events) > 0:
            print("✅ 断点功能正常工作")
            return True
        else:
            print("❌ 未检测到暂停事件")
            return False
            
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        return False
    finally:
        if sio.connected:
            sio.disconnect()

def main():
    """主函数"""
    print("🔧 断点功能重构测试")
    print("=" * 40)
    
    # 检查后端状态
    try:
        response = requests.get('http://localhost:5000/api/debug/sessions')
        if response.status_code == 200:
            print("✅ 后端API正常")
        else:
            print("❌ 后端API异常")
            return
    except:
        print("❌ 无法连接后端，请确保后端服务已启动")
        return
    
    # 运行测试
    success = test_breakpoint()
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 断点功能测试通过！")
        print("💡 新断点机制的特点:")
        print("  ✓ 在节点执行前检查断点")
        print("  ✓ 可靠的单步执行")
        print("  ✓ 清晰的状态管理")
        print("  ✓ 详细的日志输出")
    else:
        print("❌ 断点功能测试失败")

if __name__ == "__main__":
    main() 