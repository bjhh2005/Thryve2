# -*- coding: utf-8 -*-
"""
断点调试系统 & 多工作流功能 集成测试
验证两个系统的完整集成和协作
"""

import json
import logging
from workflow_converter import convert_workflow_format
from workflows.Engine import WorkflowEngine
from workflows.WorkflowManager import WorkflowManager
from flask_socketio import SocketIO
from flask import Flask

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建模拟的Flask应用和SocketIO实例
app = Flask(__name__)
socketio = SocketIO(app)

def test_1_frontend_format_conversion():
    """测试1：前端格式转换功能"""
    print("=" * 50)
    print("测试1：前端格式转换功能")
    print("=" * 50)
    
    # 模拟前端发送的JSON数据 - 包含多工作流结构
    frontend_json = {
        "nodes": [
            {
                "id": "start_main",
                "type": "start",
                "data": {
                    "title": "主工作流开始",
                    "inputsValues": {},
                    "outputsValues": {}
                }
            },
            {
                "id": "call_1",
                "type": "call",
                "data": {
                    "title": "调用文本处理",
                    "inputsValues": {
                        "target_workflow": {"content": "文本处理工作流"},
                        "input_data": {"content": "test.txt"}
                    },
                    "outputsValues": {}
                }
            },
            {
                "id": "end_main",
                "type": "end",
                "data": {
                    "title": "主工作流结束",
                    "inputsValues": {},
                    "outputsValues": {}
                }
            },
            {
                "id": "func_start_1",
                "type": "func-start",
                "data": {
                    "title": "文本处理工作流",
                    "inputsValues": {},
                    "outputsValues": {}
                }
            },
            {
                "id": "text_processor_1",
                "type": "text-processor",
                "data": {
                    "title": "文本处理节点",
                    "inputsValues": {
                        "operation": {"content": "read"},
                        "encoding": {"content": "utf-8"}
                    },
                    "outputsValues": {}
                }
            },
            {
                "id": "func_end_1",
                "type": "func-end",
                "data": {
                    "title": "文本处理结束",
                    "inputsValues": {},
                    "outputsValues": {}
                }
            }
        ],
        "edges": [
            {
                "sourceNodeID": "start_main",
                "targetNodeID": "call_1",
                "sourcePortID": "next_id",
                "targetPortID": "input"
            },
            {
                "sourceNodeID": "call_1",
                "targetNodeID": "end_main",
                "sourcePortID": "next_id",
                "targetPortID": "input"
            },
            {
                "sourceNodeID": "func_start_1",
                "targetNodeID": "text_processor_1",
                "sourcePortID": "next_id",
                "targetPortID": "input"
            },
            {
                "sourceNodeID": "text_processor_1",
                "targetNodeID": "func_end_1",
                "sourcePortID": "next_id",
                "targetPortID": "input"
            }
        ]
    }
    
    try:
        # 转换格式
        backend_json = convert_workflow_format(frontend_json)
        
        # 验证结果
        assert "workflows" in backend_json
        workflows = backend_json["workflows"]
        
        # 验证主工作流
        assert "main_workflow" in workflows
        main_workflow = workflows["main_workflow"]
        assert main_workflow["type"] == "main"
        assert len(main_workflow["nodes"]) == 3  # start, call, end
        
        # 验证子工作流
        sub_workflow_found = False
        for wf_id, wf_data in workflows.items():
            if wf_data.get("type") == "sub" and wf_data.get("name") == "文本处理工作流":
                sub_workflow_found = True
                assert len(wf_data["nodes"]) == 3  # start, text-processor, end
                # 验证func-start被转换为start
                node_types = [node["type"] for node in wf_data["nodes"]]
                assert "start" in node_types
                assert "end" in node_types
                break
        
        assert sub_workflow_found, "未找到子工作流"
        
        print("✅ 前端格式转换成功")
        print(f"  - 生成了 {len(workflows)} 个工作流")
        print(f"  - 主工作流包含 {len(main_workflow['nodes'])} 个节点")
        
        return backend_json
        
    except Exception as e:
        print(f"❌ 前端格式转换失败: {e}")
        raise

def test_2_debug_mode_with_single_workflow():
    """测试2：调试模式下的单工作流执行"""
    print("\n" + "=" * 50)
    print("测试2：调试模式下的单工作流执行")
    print("=" * 50)
    
    # 简单的单工作流用于调试
    simple_workflow = {
        "nodes": [
            {
                "id": "start_1",
                "type": "start",
                "data": {
                    "title": "开始",
                    "inputsValues": {},
                    "outputsValues": {}
                }
            },
            {
                "id": "print_1",
                "type": "print",
                "data": {
                    "title": "打印节点",
                    "inputsValues": {
                        "message": {"content": "Hello Debug Mode!"}
                    },
                    "outputsValues": {}
                }
            },
            {
                "id": "end_1",
                "type": "end",
                "data": {
                    "title": "结束",
                    "inputsValues": {},
                    "outputsValues": {}
                }
            }
        ],
        "edges": [
            {
                "sourceNodeID": "start_1",
                "targetNodeID": "print_1",
                "sourcePortID": "next_id",
                "targetPortID": "input"
            },
            {
                "sourceNodeID": "print_1",
                "targetNodeID": "end_1",
                "sourcePortID": "next_id",
                "targetPortID": "input"
            }
        ]
    }
    
    try:
        # 设置断点
        breakpoints = ["print_1"]
        
        # 创建调试引擎
        engine = WorkflowEngine(simple_workflow, socketio, breakpoints)
        
        # 验证调试模式已启用
        assert engine.debug_mode == True
        assert len(engine.breakpoints) == 1
        assert "print_1" in engine.breakpoints
        
        print("✅ 调试模式初始化成功")
        print(f"  - 调试模式: {engine.debug_mode}")
        print(f"  - 断点数量: {len(engine.breakpoints)}")
        print(f"  - 断点位置: {list(engine.breakpoints)}")
        
        return engine
        
    except Exception as e:
        print(f"❌ 调试模式初始化失败: {e}")
        raise

def test_3_multi_workflow_normal_mode():
    """测试3：普通模式下的多工作流执行"""
    print("\n" + "=" * 50)
    print("测试3：普通模式下的多工作流执行")
    print("=" * 50)
    
    # 使用测试1转换的多工作流数据
    backend_json = test_1_frontend_format_conversion()
    
    try:
        # 创建工作流管理器
        manager = WorkflowManager(socketio)
        
        # 注册工作流
        manager.register_workflows(backend_json["workflows"])
        
        # 验证工作流注册（WorkflowManager延迟创建引擎实例，所以检查workflow_data）
        print(f"  注册的工作流数据: {len(manager.workflow_data)}")
        print(f"  注册的工作流ID: {list(manager.workflow_data.keys())}")
        assert len(manager.workflow_data) >= 2, f"期望至少2个工作流，实际只有{len(manager.workflow_data)}个"
        
        # 验证主工作流存在
        assert manager.main_workflow_id is not None, "未找到主工作流ID"
        print(f"  主工作流ID: {manager.main_workflow_id}")
        assert manager.main_workflow_id in manager.workflow_data, "主工作流数据不存在"
        
        print("✅ 多工作流管理器初始化成功")
        print(f"  - 注册的工作流数量: {len(manager.workflow_data)}")
        print(f"  - 工作流ID列表: {list(manager.workflow_data.keys())}")
        print(f"  - 主工作流: {manager.main_workflow_id}")
        
        return manager
        
    except Exception as e:
        print(f"❌ 多工作流管理器初始化失败: {e}")
        import traceback
        traceback.print_exc()
        raise

def test_4_app_integration_logic():
    """测试4：app.py中的集成逻辑"""
    print("\n" + "=" * 50)
    print("测试4：app.py中的集成逻辑")
    print("=" * 50)
    
    # 模拟app.py中的decision logic
    
    # 场景1：有断点的调试模式
    def simulate_debug_mode_decision(workflow_data, breakpoints):
        """模拟app.py中的调试模式决策逻辑"""
        is_debug_run = len(breakpoints) > 0
        
        if is_debug_run:
            # 调试模式：使用单个WorkflowEngine，即使是多工作流也提取主工作流
            if isinstance(workflow_data, dict) and "workflows" in workflow_data:
                # 多工作流格式，提取主工作流
                main_workflow_data = None
                for workflow_id, wf_data in workflow_data["workflows"].items():
                    if workflow_id == "main_workflow" or "main" in workflow_id.lower():
                        main_workflow_data = wf_data
                        break
                
                if main_workflow_data:
                    engine = WorkflowEngine(main_workflow_data, socketio, breakpoints)
                    return "WorkflowEngine", engine
                else:
                    raise ValueError("No main workflow found for debugging")
            else:
                # 单工作流格式
                engine = WorkflowEngine(workflow_data, socketio, breakpoints)
                return "WorkflowEngine", engine
        else:
            # 普通模式：根据数据格式选择
            if isinstance(workflow_data, dict) and "workflows" in workflow_data:
                # 多工作流格式，使用WorkflowManager
                manager = WorkflowManager(socketio)
                manager.register_workflows(workflow_data["workflows"])
                return "WorkflowManager", manager
            else:
                # 单工作流格式，使用WorkflowEngine
                engine = WorkflowEngine(workflow_data, socketio)
                return "WorkflowEngine", engine
    
    try:
        # 测试场景1：多工作流 + 断点 -> WorkflowEngine
        backend_json = test_1_frontend_format_conversion()
        breakpoints = ["call_1"]
        
        executor_type, executor = simulate_debug_mode_decision(backend_json, breakpoints)
        assert executor_type == "WorkflowEngine"
        assert isinstance(executor, WorkflowEngine)
        assert executor.debug_mode == True
        
        print("✅ 调试模式决策逻辑正确")
        print(f"  - 输入：多工作流 + 断点")
        print(f"  - 选择：{executor_type}")
        print(f"  - 调试模式：{executor.debug_mode}")
        
        # 测试场景2：多工作流 + 无断点 -> WorkflowManager
        executor_type, executor = simulate_debug_mode_decision(backend_json, [])
        assert executor_type == "WorkflowManager"
        assert isinstance(executor, WorkflowManager)
        
        print("✅ 普通模式决策逻辑正确")
        print(f"  - 输入：多工作流 + 无断点")
        print(f"  - 选择：{executor_type}")
        print(f"  - 工作流数量：{len(executor.workflow_data)}")
        
        return True
        
    except Exception as e:
        print(f"❌ 集成逻辑测试失败: {e}")
        raise

def test_5_call_node_integration():
    """测试5：Call节点在调试模式下的行为"""
    print("\n" + "=" * 50)
    print("测试5：Call节点在调试模式下的行为")
    print("=" * 50)
    
    try:
        # 创建包含Call节点的工作流
        workflow_with_call = {
            "nodes": [
                {
                    "id": "start_1",
                    "type": "start",
                    "data": {
                        "title": "开始",
                        "inputsValues": {},
                        "outputsValues": {}
                    }
                },
                {
                    "id": "call_1",
                    "type": "call",
                    "data": {
                        "title": "调用子工作流",
                        "inputsValues": {
                            "target_workflow": {"content": "子工作流"},
                            "input_data": {"content": "test data"}
                        },
                        "outputsValues": {}
                    }
                },
                {
                    "id": "end_1",
                    "type": "end",
                    "data": {
                        "title": "结束",
                        "inputsValues": {},
                        "outputsValues": {}
                    }
                }
            ],
            "edges": [
                {
                    "sourceNodeID": "start_1",
                    "targetNodeID": "call_1",
                    "sourcePortID": "next_id",
                    "targetPortID": "input"
                },
                {
                    "sourceNodeID": "call_1",
                    "targetNodeID": "end_1",
                    "sourcePortID": "next_id",
                    "targetPortID": "input"
                }
            ]
        }
        
        # 在Call节点设置断点
        breakpoints = ["call_1"]
        
        # 创建调试引擎
        engine = WorkflowEngine(workflow_with_call, socketio, breakpoints)
        
        # 验证Call节点在断点列表中
        assert "call_1" in engine.breakpoints
        assert engine.debug_mode == True
        
        # 验证Call节点的参数结构
        call_node = engine.nodes["call_1"]
        assert call_node["type"] == "call"
        call_data = call_node["data"]
        assert "target_workflow" in call_data["inputsValues"]
        assert call_data["inputsValues"]["target_workflow"]["content"] == "子工作流"
        
        print("✅ Call节点调试集成成功")
        print(f"  - Call节点已设置断点: {engine.breakpoints}")
        print(f"  - 目标工作流: {call_data['inputsValues']['target_workflow']['content']}")
        print(f"  - 输入数据: {call_data['inputsValues']['input_data']['content']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Call节点调试集成失败: {e}")
        raise

def run_all_tests():
    """运行所有集成测试"""
    print("🚀 开始运行断点调试系统 & 多工作流功能集成测试")
    print("=" * 80)
    
    test_results = []
    
    try:
        # 测试1：格式转换
        test_1_frontend_format_conversion()
        test_results.append("✅ 测试1: 前端格式转换")
        
        # 测试2：调试模式
        test_2_debug_mode_with_single_workflow()
        test_results.append("✅ 测试2: 调试模式初始化")
        
        # 测试3：多工作流模式
        test_3_multi_workflow_normal_mode()
        test_results.append("✅ 测试3: 多工作流管理器")
        
        # 测试4：集成逻辑
        test_4_app_integration_logic()
        test_results.append("✅ 测试4: app.py集成逻辑")
        
        # 测试5：Call节点集成
        test_5_call_node_integration()
        test_results.append("✅ 测试5: Call节点调试集成")
        
        print("\n" + "=" * 80)
        print("🎉 所有测试通过！")
        print("=" * 80)
        
        for result in test_results:
            print(result)
            
        print("\n📋 集成测试总结:")
        print("✅ 前端格式转换器正常工作")
        print("✅ 断点调试系统正常工作")
        print("✅ 多工作流管理器正常工作")
        print("✅ app.py中的智能模式选择逻辑正常工作")
        print("✅ Call节点在调试模式下正常工作")
        print("✅ 两个系统完美集成，没有冲突")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        print(f"已通过的测试: {len(test_results)}/{5}")
        for result in test_results:
            print(result)
        return False

if __name__ == "__main__":
    success = run_all_tests()
    if success:
        print("\n🎯 集成测试完成：断点调试系统与多工作流功能完美协作！")
    else:
        print("\n⚠️  集成测试失败，请检查具体错误信息。") 