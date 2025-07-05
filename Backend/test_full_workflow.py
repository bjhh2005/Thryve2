# -*- coding: utf-8 -*-
"""
完整的工作流测试，包含多个子工作流和Call节点
"""
import json
import logging
from workflow_converter import convert_workflow_format

# 设置日志
logging.basicConfig(level=logging.INFO)

def test_full_workflow():
    """测试完整的多工作流转换"""
    
    # 用户提供的完整JSON数据
    frontend_json = {
        "nodes": [
            {
                "id": "start_vEudc",
                "type": "start",
                "meta": {
                    "position": {
                        "x": 180,
                        "y": 36
                    }
                },
                "data": {
                    "title": "Start_1",
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "default": "Hello Flow."
                            },
                            "enable": {
                                "type": "boolean",
                                "default": True
                            }
                        }
                    }
                }
            },
            {
                "id": "call_-PcAk",
                "type": "call",
                "meta": {
                    "position": {
                        "x": 640,
                        "y": 0
                    }
                },
                "data": {
                    "title": "Call_1",
                    "inputs": {
                        "type": "object",
                        "required": [
                            "target_workflow"
                        ],
                        "properties": {
                            "target_workflow": {
                                "type": "string",
                                "title": "Target Workflow",
                                "description": "The title of the start node of the subworkflow to call"
                            },
                            "input_data": {
                                "type": "string",
                                "title": "Input Data",
                                "description": "Data to pass to the subworkflow (optional)"
                            }
                        }
                    },
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "output": {
                                "type": "string",
                                "title": "Output",
                                "description": "Result returned from the subworkflow"
                            }
                        }
                    },
                    "inputsValues": {
                        "target_workflow": {
                            "type": "constant",
                            "content": "func1"
                        }
                    }
                }
            },
            {
                "id": "call_4tIJj",
                "type": "call",
                "meta": {
                    "position": {
                        "x": 1100,
                        "y": 0
                    }
                },
                "data": {
                    "title": "Call_2",
                    "inputs": {
                        "type": "object",
                        "required": [
                            "target_workflow"
                        ],
                        "properties": {
                            "target_workflow": {
                                "type": "string",
                                "title": "Target Workflow",
                                "description": "The title of the start node of the subworkflow to call"
                            },
                            "input_data": {
                                "type": "string",
                                "title": "Input Data",
                                "description": "Data to pass to the subworkflow (optional)"
                            }
                        }
                    },
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "output": {
                                "type": "string",
                                "title": "Output",
                                "description": "Result returned from the subworkflow"
                            }
                        }
                    },
                    "inputsValues": {
                        "target_workflow": {
                            "type": "constant",
                            "content": "func2"
                        }
                    }
                }
            },
            {
                "id": "end_oHeNu",
                "type": "end",
                "meta": {
                    "position": {
                        "x": 1560,
                        "y": 36
                    }
                },
                "data": {
                    "title": "End_1",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "result": {
                                "type": "string",
                                "description": "工作流的最终结果"
                            }
                        }
                    }
                }
            },
            {
                "id": "func_start_Kprtq",
                "type": "func-start",
                "meta": {
                    "position": {
                        "x": 180,
                        "y": 255.5
                    }
                },
                "data": {
                    "title": "func1",
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "default": "Hello Flow."
                            },
                            "enable": {
                                "type": "boolean",
                                "default": True
                            }
                        }
                    }
                }
            },
            {
                "id": "print_UuH9C",
                "type": "print",
                "meta": {
                    "position": {
                        "x": 640,
                        "y": 255
                    }
                },
                "data": {
                    "title": "Print_1",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "input": {
                                "type": "string",
                                "title": "Input Text",
                                "description": "Text from previous node"
                            }
                        }
                    },
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "result": {
                                "type": "string",
                                "title": "Printed Text",
                                "description": "The text that was printed"
                            }
                        }
                    },
                    "inputsValues": {
                        "input": {
                            "type": "constant",
                            "content": "来自func1的输出"
                        }
                    }
                }
            },
            {
                "id": "Func_end_FLDj5",
                "type": "func-end",
                "meta": {
                    "position": {
                        "x": 1100,
                        "y": 255.5
                    }
                },
                "data": {
                    "title": "Function End_1",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "result": {
                                "type": "string",
                                "description": "The result of the function"
                            }
                        }
                    }
                }
            },
            {
                "id": "func_start__Cw6E",
                "type": "func-start",
                "meta": {
                    "position": {
                        "x": 180,
                        "y": 474.5
                    }
                },
                "data": {
                    "title": "func2",
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "default": "Hello Flow."
                            },
                            "enable": {
                                "type": "boolean",
                                "default": True
                            }
                        }
                    }
                }
            },
            {
                "id": "print_qW63s",
                "type": "print",
                "meta": {
                    "position": {
                        "x": 640,
                        "y": 474
                    }
                },
                "data": {
                    "title": "Print_2",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "input": {
                                "type": "string",
                                "title": "Input Text",
                                "description": "Text from previous node"
                            }
                        }
                    },
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "result": {
                                "type": "string",
                                "title": "Printed Text",
                                "description": "The text that was printed"
                            }
                        }
                    },
                    "inputsValues": {
                        "input": {
                            "type": "constant",
                            "content": "来自func2的输出"
                        }
                    }
                }
            },
            {
                "id": "call_bQ93I",
                "type": "call",
                "meta": {
                    "position": {
                        "x": 1100,
                        "y": 438.5
                    }
                },
                "data": {
                    "title": "Call_3",
                    "inputs": {
                        "type": "object",
                        "required": [
                            "target_workflow"
                        ],
                        "properties": {
                            "target_workflow": {
                                "type": "string",
                                "title": "Target Workflow",
                                "description": "The title of the start node of the subworkflow to call"
                            },
                            "input_data": {
                                "type": "string",
                                "title": "Input Data",
                                "description": "Data to pass to the subworkflow (optional)"
                            }
                        }
                    },
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "output": {
                                "type": "string",
                                "title": "Output",
                                "description": "Result returned from the subworkflow"
                            }
                        }
                    },
                    "inputsValues": {
                        "target_workflow": {
                            "type": "constant",
                            "content": "fun3"
                        }
                    }
                }
            },
            {
                "id": "Func_end_pbKk_",
                "type": "func-end",
                "meta": {
                    "position": {
                        "x": 1560,
                        "y": 474.5
                    }
                },
                "data": {
                    "title": "Function End_2",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "result": {
                                "type": "string",
                                "description": "The result of the function"
                            }
                        }
                    }
                }
            },
            {
                "id": "func_start_zM0RV",
                "type": "func-start",
                "meta": {
                    "position": {
                        "x": 180,
                        "y": 693.5
                    }
                },
                "data": {
                    "title": "fun3",
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "default": "Hello Flow."
                            },
                            "enable": {
                                "type": "boolean",
                                "default": True
                            }
                        }
                    }
                }
            },
            {
                "id": "print_J4Cik",
                "type": "print",
                "meta": {
                    "position": {
                        "x": 640,
                        "y": 693
                    }
                },
                "data": {
                    "title": "Print_3",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "input": {
                                "type": "string",
                                "title": "Input Text",
                                "description": "Text from previous node"
                            }
                        }
                    },
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "result": {
                                "type": "string",
                                "title": "Printed Text",
                                "description": "The text that was printed"
                            }
                        }
                    },
                    "inputsValues": {
                        "input": {
                            "type": "constant",
                            "content": "来自fun3的输出"
                        }
                    }
                }
            },
            {
                "id": "Func_end_RRtKc",
                "type": "func-end",
                "meta": {
                    "position": {
                        "x": 1100,
                        "y": 693.5
                    }
                },
                "data": {
                    "title": "Function End_3",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "result": {
                                "type": "string",
                                "description": "The result of the function"
                            }
                        }
                    }
                }
            }
        ],
        "edges": [
            {
                "sourceNodeID": "start_vEudc",
                "targetNodeID": "call_-PcAk"
            },
            {
                "sourceNodeID": "call_-PcAk",
                "targetNodeID": "call_4tIJj"
            },
            {
                "sourceNodeID": "call_4tIJj",
                "targetNodeID": "end_oHeNu"
            },
            {
                "sourceNodeID": "func_start_Kprtq",
                "targetNodeID": "print_UuH9C"
            },
            {
                "sourceNodeID": "print_UuH9C",
                "targetNodeID": "Func_end_FLDj5"
            },
            {
                "sourceNodeID": "func_start__Cw6E",
                "targetNodeID": "print_qW63s"
            },
            {
                "sourceNodeID": "print_qW63s",
                "targetNodeID": "call_bQ93I"
            },
            {
                "sourceNodeID": "call_bQ93I",
                "targetNodeID": "Func_end_pbKk_"
            },
            {
                "sourceNodeID": "func_start_zM0RV",
                "targetNodeID": "print_J4Cik"
            },
            {
                "sourceNodeID": "print_J4Cik",
                "targetNodeID": "Func_end_RRtKc"
            }
        ]
    }
    
    try:
        print("=== 完整工作流转换测试 ===")
        print(f"输入节点数: {len(frontend_json['nodes'])}")
        print(f"输入边数: {len(frontend_json['edges'])}")
        
        # 执行转换
        backend_json = convert_workflow_format(frontend_json)
        
        print("\n=== 转换结果详情 ===")
        print(f"生成工作流数: {len(backend_json['workflows'])}")
        
        for workflow_id, workflow in backend_json['workflows'].items():
            print(f"\n工作流 '{workflow_id}':")
            print(f"  类型: {workflow['type']}")
            print(f"  名称: {workflow['name']}")
            print(f"  节点数: {len(workflow['nodes'])}")
            print(f"  边数: {len(workflow['edges'])}")
            
            # 显示节点详情
            for node in workflow['nodes']:
                print(f"    节点 {node['id']}: {node['type']}")
                if node['type'] == 'call':
                    target = node['data']['inputsValues'].get('target_workflow', {}).get('content', 'N/A')
                    print(f"      -> 调用目标: {target}")
                elif node['type'] == 'print':
                    content = node['data']['inputsValues'].get('input', {}).get('content', 'N/A')
                    print(f"      -> 打印内容: {content}")
            
            # 显示边详情
            print(f"  边连接:")
            for edge in workflow['edges']:
                print(f"    {edge['sourceNodeID']} -> {edge['targetNodeID']}")
        
        # 验证Call节点的目标
        print("\n=== Call节点验证 ===")
        main_workflow = backend_json['workflows']['main_workflow']
        call_nodes = [node for node in main_workflow['nodes'] if node['type'] == 'call']
        
        for call_node in call_nodes:
            target = call_node['data']['inputsValues'].get('target_workflow', {}).get('content')
            print(f"Call节点 {call_node['id']} 目标: {target}")
            
            # 检查目标工作流是否存在
            target_found = False
            for workflow_id, workflow in backend_json['workflows'].items():
                if workflow.get('name') == target:
                    target_found = True
                    print(f"  -> 找到目标工作流: {workflow_id}")
                    break
            
            if not target_found:
                print(f"  -> 警告: 目标工作流 '{target}' 未找到!")
        
        # 保存结果到文件
        with open('full_converted_workflow.json', 'w', encoding='utf-8') as f:
            json.dump(backend_json, f, ensure_ascii=False, indent=2)
        
        print("\n=== 转换成功 ===")
        print("结果已保存到 full_converted_workflow.json")
        
        return True
        
    except Exception as e:
        print(f"\n=== 转换失败 ===")
        print(f"错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_full_workflow() 