# -*- coding: utf-8 -*-
"""
测试工作流转换器
"""
import json
import logging
from workflow_converter import convert_workflow_format

# 设置日志
logging.basicConfig(level=logging.INFO)

def test_conversion():
    """测试转换功能"""
    
    # 测试数据（基于用户提供的JSON）
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
                            "content": "111"
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
            }
        ],
        "edges": [
            {
                "sourceNodeID": "start_vEudc",
                "targetNodeID": "call_-PcAk"
            },
            {
                "sourceNodeID": "call_-PcAk",
                "targetNodeID": "end_oHeNu"
            },
            {
                "sourceNodeID": "func_start_Kprtq",
                "targetNodeID": "print_UuH9C"
            },
            {
                "sourceNodeID": "print_UuH9C",
                "targetNodeID": "Func_end_FLDj5"
            }
        ]
    }
    
    try:
        print("=== 开始转换测试 ===")
        print(f"输入节点数: {len(frontend_json['nodes'])}")
        print(f"输入边数: {len(frontend_json['edges'])}")
        
        # 执行转换
        backend_json = convert_workflow_format(frontend_json)
        
        print("\n=== 转换结果 ===")
        print(f"生成工作流数: {len(backend_json['workflows'])}")
        
        for workflow_id, workflow in backend_json['workflows'].items():
            print(f"\n工作流 '{workflow_id}':")
            print(f"  类型: {workflow['type']}")
            print(f"  名称: {workflow['name']}")
            print(f"  节点数: {len(workflow['nodes'])}")
            print(f"  边数: {len(workflow['edges'])}")
            
            # 显示节点类型
            node_types = [node['type'] for node in workflow['nodes']]
            print(f"  节点类型: {set(node_types)}")
        
        # 保存结果到文件
        with open('converted_workflow.json', 'w', encoding='utf-8') as f:
            json.dump(backend_json, f, ensure_ascii=False, indent=2)
        
        print("\n=== 转换成功 ===")
        print("结果已保存到 converted_workflow.json")
        
        return True
        
    except Exception as e:
        print(f"\n=== 转换失败 ===")
        print(f"错误: {str(e)}")
        return False

if __name__ == "__main__":
    test_conversion() 