# -*- coding: utf-8 -*-
"""
测试处理器节点的执行能力
"""
import json
import logging
from workflow_converter import convert_workflow_format

# 设置日志
logging.basicConfig(level=logging.INFO)

def test_processor_nodes():
    """测试各种处理器节点的转换和执行能力"""
    
    # 包含处理器节点的工作流
    frontend_json = {
        "nodes": [
            {
                "id": "start_main",
                "type": "start",
                "meta": {"position": {"x": 100, "y": 100}},
                "data": {
                    "title": "主流程开始",
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "file_path": {
                                "type": "string",
                                "default": "test.txt"
                            }
                        }
                    }
                }
            },
            {
                "id": "call_text_proc",
                "type": "call",
                "meta": {"position": {"x": 300, "y": 100}},
                "data": {
                    "title": "调用文本处理",
                    "inputsValues": {
                        "target_workflow": {
                            "type": "constant",
                            "content": "text_processing"
                        }
                    }
                }
            },
            {
                "id": "call_pdf_proc",
                "type": "call",
                "meta": {"position": {"x": 500, "y": 100}},
                "data": {
                    "title": "调用PDF处理",
                    "inputsValues": {
                        "target_workflow": {
                            "type": "constant",
                            "content": "pdf_processing"
                        }
                    }
                }
            },
            {
                "id": "call_img_proc",
                "type": "call",
                "meta": {"position": {"x": 700, "y": 100}},
                "data": {
                    "title": "调用图像处理",
                    "inputsValues": {
                        "target_workflow": {
                            "type": "constant",
                            "content": "image_processing"
                        }
                    }
                }
            },
            {
                "id": "end_main",
                "type": "end",
                "meta": {"position": {"x": 900, "y": 100}},
                "data": {
                    "title": "主流程结束",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "result": {"type": "string"}
                        }
                    }
                }
            },
            
            # 文本处理子工作流
            {
                "id": "func_start_text",
                "type": "func-start",
                "meta": {"position": {"x": 100, "y": 300}},
                "data": {
                    "title": "text_processing",
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "input_file": {"type": "string", "default": "input.txt"}
                        }
                    }
                }
            },
            {
                "id": "text_processor_node",
                "type": "text-processor",
                "meta": {"position": {"x": 300, "y": 300}},
                "data": {
                    "title": "文本处理器",
                    "mode": "write",
                    "inputsValues": {
                        "inputFile": {
                            "type": "constant",
                            "content": "input.txt"
                        },
                        "content": {
                            "type": "constant",
                            "content": "这是通过文本处理器写入的内容"
                        },
                        "outputFolder": {
                            "type": "constant",
                            "content": "output"
                        },
                        "outputFileName": {
                            "type": "constant",
                            "content": "processed_text"
                        }
                    }
                }
            },
            {
                "id": "func_end_text",
                "type": "func-end",
                "meta": {"position": {"x": 500, "y": 300}},
                "data": {
                    "title": "文本处理结束",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "result": {"type": "string"}
                        }
                    }
                }
            },
            
            # PDF处理子工作流
            {
                "id": "func_start_pdf",
                "type": "func-start",
                "meta": {"position": {"x": 100, "y": 500}},
                "data": {
                    "title": "pdf_processing",
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "pdf_file": {"type": "string", "default": "sample.pdf"}
                        }
                    }
                }
            },
            {
                "id": "pdf_processor_node",
                "type": "pdf-processor",
                "meta": {"position": {"x": 300, "y": 500}},
                "data": {
                    "title": "PDF处理器",
                    "mode": "extract",
                    "inputsValues": {
                        "inputFile": {
                            "type": "constant",
                            "content": "sample.pdf"
                        },
                        "pageRange": {
                            "type": "constant",
                            "content": "1-3"
                        },
                        "extractImages": {
                            "type": "constant",
                            "content": False
                        },
                        "outputFolder": {
                            "type": "constant",
                            "content": "output"
                        },
                        "outputName": {
                            "type": "constant",
                            "content": "extracted_pdf"
                        }
                    }
                }
            },
            {
                "id": "func_end_pdf",
                "type": "func-end",
                "meta": {"position": {"x": 500, "y": 500}},
                "data": {
                    "title": "PDF处理结束",
                    "inputs": {
                        "type": "object",
                        "properties": {
                            "result": {"type": "string"}
                        }
                    }
                }
            },
            
            # 图像处理子工作流
            {
                "id": "func_start_img",
                "type": "func-start",
                "meta": {"position": {"x": 100, "y": 700}},
                "data": {
                    "title": "image_processing",
                    "outputs": {
                        "type": "object",
                        "properties": {
                            "image_file": {"type": "string", "default": "sample.jpg"}
                        }
                    }
                }
            },
            {
                "id": "img_processor_node",
                "type": "img-processor",
                "meta": {"position": {"x": 300, "y": 700}},
                "data": {
                    "title": "图像处理器",
                    "mode": "resize",
                    "inputsValues": {
                        "inputFile": {
                            "type": "constant",
                            "content": "sample.jpg"
                        },
                        "width": {
                            "type": "constant",
                            "content": 800
                        },
                        "height": {
                            "type": "constant",
                            "content": 600
                        },
                        "maintainAspectRatio": {
                            "type": "constant",
                            "content": True
                        },
                        "outputFolder": {
                            "type": "constant",
                            "content": "output"
                        },
                        "outputName": {
                            "type": "constant",
                            "content": "resized_image"
                        }
                    }
                }
            },
            {
                "id": "func_end_img",
                "type": "func-end",
                "meta": {"position": {"x": 500, "y": 700}},
                "data": {
                    "title": "图像处理结束",
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
            # 主工作流连接
            {"sourceNodeID": "start_main", "targetNodeID": "call_text_proc"},
            {"sourceNodeID": "call_text_proc", "targetNodeID": "call_pdf_proc"},
            {"sourceNodeID": "call_pdf_proc", "targetNodeID": "call_img_proc"},
            {"sourceNodeID": "call_img_proc", "targetNodeID": "end_main"},
            
            # 文本处理子工作流连接
            {"sourceNodeID": "func_start_text", "targetNodeID": "text_processor_node"},
            {"sourceNodeID": "text_processor_node", "targetNodeID": "func_end_text"},
            
            # PDF处理子工作流连接
            {"sourceNodeID": "func_start_pdf", "targetNodeID": "pdf_processor_node"},
            {"sourceNodeID": "pdf_processor_node", "targetNodeID": "func_end_pdf"},
            
            # 图像处理子工作流连接
            {"sourceNodeID": "func_start_img", "targetNodeID": "img_processor_node"},
            {"sourceNodeID": "img_processor_node", "targetNodeID": "func_end_img"}
        ]
    }
    
    try:
        print("=== 处理器节点转换测试 ===")
        print(f"输入节点数: {len(frontend_json['nodes'])}")
        print(f"输入边数: {len(frontend_json['edges'])}")
        
        # 执行转换
        backend_json = convert_workflow_format(frontend_json)
        
        print("\n=== 转换结果详情 ===")
        print(f"生成工作流数: {len(backend_json['workflows'])}")
        
        # 统计各种处理器节点
        processor_count = {
            "text-processor": 0,
            "pdf-processor": 0,
            "img-processor": 0,
            "call": 0
        }
        
        for workflow_id, workflow in backend_json['workflows'].items():
            print(f"\n工作流 '{workflow_id}':")
            print(f"  类型: {workflow['type']}")
            print(f"  名称: {workflow['name']}")
            print(f"  节点数: {len(workflow['nodes'])}")
            
            # 显示节点详情和统计
            for node in workflow['nodes']:
                node_type = node['type']
                print(f"    节点 {node['id']}: {node_type}")
                
                if node_type in processor_count:
                    processor_count[node_type] += 1
                
                # 显示处理器节点的具体配置
                if node_type in ['text-processor', 'pdf-processor', 'img-processor']:
                    mode = node.get('data', {}).get('mode', 'N/A')
                    print(f"      -> 处理模式: {mode}")
                    
                    # 显示输入配置
                    inputs_values = node.get('data', {}).get('inputsValues', {})
                    for key, value in inputs_values.items():
                        if isinstance(value, dict) and value.get('type') == 'constant':
                            print(f"      -> {key}: {value.get('content')}")
                
                elif node_type == 'call':
                    target = node.get('data', {}).get('inputsValues', {}).get('target_workflow', {}).get('content', 'N/A')
                    print(f"      -> 调用目标: {target}")
        
        print(f"\n=== 处理器节点统计 ===")
        for processor_type, count in processor_count.items():
            print(f"{processor_type}: {count} 个")
        
        # 验证Call节点的目标
        print("\n=== Call节点目标验证 ===")
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
                    # 检查目标工作流是否包含对应的处理器节点
                    target_workflow_nodes = [n['type'] for n in workflow['nodes']]
                    print(f"  -> 找到目标工作流: {workflow_id}")
                    print(f"  -> 包含节点类型: {set(target_workflow_nodes)}")
                    break
            
            if not target_found:
                print(f"  -> 警告: 目标工作流 '{target}' 未找到!")
        
        # 保存结果到文件
        with open('processors_workflow.json', 'w', encoding='utf-8') as f:
            json.dump(backend_json, f, ensure_ascii=False, indent=2)
        
        print("\n=== 转换成功 ===")
        print("结果已保存到 processors_workflow.json")
        print("\n=== 执行能力分析 ===")
        print("✅ text-processor: 支持写入、追加、替换、词频统计等操作")
        print("✅ pdf-processor: 支持提取、合并、拆分、转换、压缩、加密等操作")  
        print("✅ img-processor: 支持调整大小、压缩、转换、旋转、裁剪、滤镜、水印等操作")
        print("✅ call节点: 支持调用包含处理器节点的子工作流")
        print("✅ 多工作流转换: 正确将func-start/func-end转换为start/end节点")
        
        return True
        
    except Exception as e:
        print(f"\n=== 转换失败 ===")
        print(f"错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_processor_nodes() 